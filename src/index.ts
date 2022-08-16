import puppeteer = require('puppeteer')
import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { GetMenuResponse, Restaurant, SearchRestaurantResponse, Order, CreateOrderResponse, CreateOrderEntree, CreateOrderContent, AddToOrderResponse, AddUtensilsResponse, ShapeHeaders, Wallet, CheckoutError } from './types'
import { TwoFactorRequired } from './errors'

class Chipotle {
    private browser!: puppeteer.Browser
    private mainPage!: puppeteer.Page
    private static readonly ocpKey: string = "b4d9f36380184a3788857063bce25d6a" // seems to be static
    private userAgent: string = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.0 Safari/537.36"
    private token: string
    private client!: AxiosInstance

    private constructor() {
        this.token = ""
    }

    /**
    * gets the jwt token associated with the object
    * @returns {string} - the jwt token
    */
    getToken(): String {
        return this.token
    }

    /**
    * sets the browser user agent
    */
    async setUserAgent(userAgent: string): Promise<void> {
        this.userAgent = userAgent
        this.mainPage.setUserAgent(this.userAgent)
    }

    /**
     * searches for Chipotles near a lat long.
     * @param {number} latitude - the latitude of the location to search in
     * @param {number} longitude - the longitude of the location to search in
     * @param {number} searchRadius - the search radius. unknown unit. might be feet?
     * @returns {Restauranti[]} - a list of restaurants near the location provided
     */
    async searchRestaurants(latitude: number, longitude: number, searchRadius: number): Promise<Restaurant[]> {
        return ((await this.client.post(
            '/restaurant/v3/restaurant',
            {
                latitude: latitude,
                longitude: longitude,
                radius: searchRadius,
                restaurantStatuses: ["OPEN", "LAB"],
                conceptIds: ["CMG"], // stands for Chipotle Mexican Grill?
                orderBy: "distance",
                orderByDescending: false,
                pageSize: 10,
                pageIndex: 0,
                embeds: {
                    addressTypes: ["MAIN"],
                    realHours: true,
                    directions: true,
                    onlineOrdering: true
                }
            }
        )).data as unknown as SearchRestaurantResponse).data
    }

    /**
    * gets a restaurants menu
    * @param {number} restaurantId - the id number of the restaurant
    * @returns {GetMenuResponse} - a response object containing the menu and store id
    */
    async getRestaurantMenu(restaurantId: number): Promise<GetMenuResponse> {
        return (await this.client.get(`/menuinnovation/v1/restaurants/${restaurantId}/onlinemenu?channelId=web&includeUnavailableItems=true`)).data
    }

    /** 
    * creates an empty order
    * @param {number} restaurantId - the id number of the desired restaurant
    * @returns {Array.<{order: Order, etag: string}>} - an order object as well as the associated etag. the etag is required to modify the order further (atc)
    */
    async createOrder(restaurantId: number): Promise<[Order, string]> {
        const response = await this.client.post(
            '/order/v2/online?embeds=order',
            {
                restaurantId: restaurantId,
                orderType: 1,
                orderSource: "WebV2"
            }
        )

        return [response.data.order, response.headers['etag']]
    }

    /**
    * add's an item to the specified cart
    * @param {string} orderId - the target order id
    * @param {string} eTag - the most recent etag associated with the order. this is returned from createOrder and all order related methods
    * @param {string} mealName - the name of the meal. this is commonly the customers name
    * @param {CreateOrderEntree[]} entrees - an array of entrees to add to the order
    * @param {CreateOrderContent[]} sides - an array of sides to add to the order
    * @param {CreateOrderContent[]} drinks - an array of drinks to add to the order
    * @returns {Array.<{addToOrderResponse: AddToOrderResponse, etag: string}>} - a response body containing the mealId, order contents, and swapped entrees. the second return value is the etag
    */
    async addItemToCart(orderId: string, eTag: string, mealName: string, entrees: CreateOrderEntree[], sides: CreateOrderContent[], drinks: CreateOrderContent[]): Promise<[AddToOrderResponse, string]> {
        const response = await this.client.post(
            `/order/v2/online/${orderId}/meals?embeds=order&finalizePricing=true`,
            {
                meal: {
                    mealName: mealName,
                    entrees: entrees,
                    sides: sides,
                    drinks: drinks
                }
            },
            { headers: { "If-Match": eTag } }
        )

        return [response.data, response.headers['etag']]
    }

    /**
    * adds utensils to an order
    * @param {string} orderId - the target order id
    * @param {string} eTag - the most recent etag associated with the order. this is returned from createOrder and all order related methods
    * @returns {Array.<{addUtensilsResponse: AddUtensilsResponse, etag: string}>} - a response body containing the utensil item id and the order body
    */
    async addUtensilsToOrder(orderId: string, eTag: string): Promise<[AddUtensilsResponse, string]> {
        const response = await this.client.post(
            `/order/v2/online/${orderId}/nonFoodItems?embeds=order&finalizePricing=true`,
            {
                "menuItemId": "CMG-6110",
                "quantity": 1,
                "isUpSell": false
            },
            { headers: { "If-Match": eTag } }
        )

        return [response.data, response.headers['etag']]
    }

    /**
    * gets a list of saved payment methods
    * @returns {Wallet[]} a list of saved payment methods
    */
    async getWallet(): Promise<Wallet[]> {
        return ((await this.client.get('/transaction/v3/wallet/wallet')).data as unknown as Wallet[])
    }

    /**
    * gets a list of available pickup times at a specified restaurant
    * @param {number} restaurantId - the id of the target restaurant
    * @returns {string[]} - an array of pickup times. The time is formatted YYYY-MM-DDTHH:MM:SS
    */
    async getRestaurantPickupTimes(restaurantId: number): Promise<string[]> {
        return ((await this.client.get(`/sput/v1/pickuptimes/${restaurantId}?itemCount=1`)).data as unknown as string[])
    }

    /**
    * changes the stored order data on the browser instance
    * @param {string} etag - the most recent etag associated with the order
    * @param {Order} order - the order body to save
    */
    async changeStoredOrder(etag: string, order: Order): Promise<void> {
        await this.mainPage.evaluate((etag, order) => {
            const vueStorageString = localStorage.getItem("cmg-vuex")
            if (!vueStorageString) {
                throw new Error("No local storage found")
            }
            const storage = JSON.parse(vueStorageString)
            storage.order.pendingOrder = {
                etag: etag,
                order: JSON.parse(order),
                discounts: []
            }

            localStorage.setItem("cmg-vuex", JSON.stringify(storage))
        }, etag, JSON.stringify(order))
    }

    /**
    * adds an entree + sides + drinks to cart using the browser. not recommended to use over the changeStoredOrder and addItemToCart methods. this method can be prone to runtime errors
    * @param {CreateOrderEntree} entree - the entree object to add
    * @param {CreateOrderContent[]} drinks - an array of drink objects to add
    * @param {CreateOrderContent[]} sides - an array of side objects to add
    * @param {string} mealName - the name of the meal.typically the customer's name
    * @param {boolean} utensils - whether to add utensils to the order
    */
    async browserAtc(entree: CreateOrderEntree, drinks: CreateOrderContent[], sides: CreateOrderContent[], mealName: string, utensils: boolean): Promise<any> {
        await this.mainPage.goto('https://chipotle.com/')
        const type = entree.menuItemName.split(' ')[1]

        await this.mainPage.waitForSelector(`[data-qa-group-name*="${type}"]`)
        await this.mainPage.click(`[data-qa-group-name*="${type}"]`)
        await this.mainPage.waitForSelector(`[data-qa-item-id="${entree.menuItemId}"]`)
        await this.mainPage.click(`[data-qa-item-id="${entree.menuItemId}"]`)
        for (let i = 0; i < entree.contents.length; i++) {
            await this.mainPage.click(`[data-qa-item-id="${entree.contents[i].menuItemId}"]`)
            if (entree.contents[i].customizationId) {
                await this.mainPage.click(`[data-qa-item-id="${entree.contents[i].menuItemId}"] .kebab-menu-container`)
                await this.mainPage.waitForSelector(`.customizations :nth-child(${(entree.contents[i].customizationId as number) + 1})`)
                await this.mainPage.click(`.customizations :nth-child(${(entree.contents[i].customizationId as number) + 1})`)
            }
        }
        for (let i = 0; i < sides.length; i++) {
            await this.mainPage.click(`[data-qa-item-id="${sides[i].menuItemId}"]`)
            for (let j = 1; j < sides[i].quantity; j++) {
                await this.mainPage.click(`[data-qa-item-id="${sides[i].menuItemId}"] [aria-label="Increment"]`)
            }
        }

        for (let i = 0; i < drinks.length; i++) {
            await this.mainPage.click(`[data-qa-item-id="${drinks[i].menuItemId}"]`)
            for (let j = 1; j < drinks[i].quantity; j++) {
                await this.mainPage.click(`[data-qa-item-id="${drinks[i].menuItemId}"] [aria-label="Increment"]`)
            }
        }

        await this.mainPage.click('[meal-ids="complete-meal"]')
        await this.mainPage.waitForSelector('.button.save.size-md.type-primary')
        await this.mainPage.click('[aria-label="Enter the Meal Name"]', { clickCount: 3 }) // click 3x so input clears field
        await this.mainPage.type('[aria-label="Enter the Meal Name"]', mealName, { delay: 100 })
        await this.mainPage.click('.button.save.size-md.type-primary')
        await this.mainPage.waitForSelector('.bagCheckout')
        if (utensils) {
            await this.mainPage.click('[aria-label="Include Napkins & Utensils"]')
            await this.mainPage.waitForResponse(response => response.url().includes('nonFoodItems') && response.request().method() == "POST")
        }
    }

    /**
    * checks out the browser instance's current cart
    * @param {string} pickupTime - the order pickup time. this should be in the same format returned in getRestaurantPickupTimes (YYYY-MM-DDTHH:MM:SS)
    * @param {string} cardLastFour - the last four digits of the saved credit card
    * @returns {string|CheckoutError[]} - an array of checkout errors or a success message
    */
    async browserCheckout(pickupTime: string, cardLastFour: string): Promise<string | CheckoutError[]> {
        await this.mainPage.goto('https://chipotle.com/')
        await this.mainPage.waitForSelector('.bag-container')
        await this.mainPage.click('.bag-container')
        await this.mainPage.waitForSelector('.checkout')
        await this.mainPage.click('.checkout')

        const time = new Date(Date.parse(pickupTime))
        let hours = time.getHours()
        let minutes = time.getMinutes()
        const ending = hours >= 12 ? 'pm' : 'am'
        hours = hours % 12
        hours = hours ? hours : 12 // make hour 0 to 12 and 0 evaluates to false 
        const timeString = `${hours}:${minutes < 10 ? "0" + minutes : minutes}${ending}`

        await this.mainPage.waitForXPath(`//*[normalize-space() = '${timeString}']`)
        const timeButton = (await this.mainPage.$x(`//*[normalize-space() = '${timeString}']`))[0]
        try {
            await timeButton.click()
        } catch (error: any) {
            if (error.message.includes('not clickable')) {
                await this.mainPage.click('.expander-container')
                await timeButton.click()
            } else {
                console.log(timeButton)
                throw new Error('Invalid time')
            }
        }

        const card = (await this.mainPage.$x(`//div[contains(text(), '${cardLastFour}')]/parent::*/parent::*/div[@role='radio']`))[0]
        await card.click()

        await this.mainPage.click('.submit-btn')
        const orderSubmitResponse = await this.mainPage.waitForResponse(response => response.url().includes('/submit') && response.request().method() == "POST")
        try {
            return orderSubmitResponse.json()
        } catch (error) {
            return orderSubmitResponse.text()
        }
    }

    /**
    * checks out a specified order. requires shape antibot headers. i don't have access to a shape cookie api so the function is largely undocumented
    * @param {string} orderId - the target order id 
    * @param {string} eTag - the most recent etag associated with the order
    * @param {ShapeHeaders} shapeHeaders - an object of shape antibot headers required for order submissions
    * @param {Wallet} wallet - the payment method wallet object returned from getWallet
    * @param {string} pickupTime - the order pickup time. this should be in the same format returned in getRestaurantPickupTimes (YYYY-MM-DDTHH:MM:SS)
    * @returns {AxiosResponse} - returns a response object instead of just the body for debugging purposes. 
    */
    async checkout(orderId: string, eTag: string, shapeHeaders: ShapeHeaders, wallet: Wallet, pickupTime: string): Promise<AxiosResponse> {
        this.client.interceptors.request.use(request => {
            console.log(request.headers)
            console.log(request.data)
            return request
        })
        const response = await this.client.post(
            `/order/v2/online${orderId}/submit`,
            {
                bagPickupLocationId: 1,
                isAboveStorePayment: true,
                payments: [
                    {
                        cardHolderName: wallet.cardHolderName,
                        creditCardSingleUseToken: wallet.tokenizedAccountNumber,
                        chipotleWalletId: wallet.tokenId,
                        creditCardType: wallet.paymentMethod,
                        creditCardExpiration: wallet.expirationMonth + wallet.expirationYear,
                        creditCardZipcode: wallet.billingZip,
                        paymentType: wallet.paymentTypeId,
                        paymentProviderId: wallet.paymentProviderId,
                        lastFourAccountNumbers: wallet.lastFourAccountNumbers
                    }
                ],
                pickupDateTime: pickupTime
            },
            { headers: { ...shapeHeaders, "If-Match": eTag } }
        )

        return response

    }

    /**
    * logs the browser instance into a chipotle account
    * @param {string} email - the account email
    * @param {string} password - the account password
    * @param {number=5} maxAttempts - the max amount of login retry attempts. default 5
    */
    async login(email: string, password: string, maxAttempts: number = 5): Promise<void> {
        await this.mainPage.goto('http://chipotle.com')
        await this.mainPage.click('[data-button="sign-in"]')
        await this.mainPage.waitForSelector('[aria-label="Enter email address"]')
        await this.mainPage.type('[aria-label="Enter email address"]', email, { delay: 100 })
        await this.mainPage.type('[aria-label="Enter password"]', password, { delay: 100 })

        let loginResponse: puppeteer.HTTPResponse | null = null

        for (let i = 0; i < maxAttempts; i++) {
            try {
                await this.mainPage.waitForSelector('[class*="two-step-verification-welcome-form"]', { timeout: 5000 })
                throw new TwoFactorRequired('Two factor authentication required')
            } catch (error) {
                if (error instanceof TwoFactorRequired) {
                    throw error
                }
            } // errors always 

            await this.mainPage.click('.sign-in-button')

            try {
                loginResponse = await this.mainPage.waitForResponse(
                    (response) => response.url() == "https://services.chipotle.com/auth/v2/customer/login" && response.request().method() == 'POST',
                    { timeout: 10000 }
                )
                break
            } catch (error) { }
        }

        if (!loginResponse) {
            throw new Error(`Failed login after ${maxAttempts} attempts`)
        }

        if (loginResponse.status() == 200) {
            this.token = (await loginResponse.json())['jwt'].replace('Bearer ', '')
        } else {
            throw new Error(`Login failed with code ${loginResponse.status()}`)
        }

        this.client = axios.create({
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Ocp-Apim-Subscription-Key': Chipotle.ocpKey
            },
            baseURL: 'https://services.chipotle.com',
            responseType: 'json'
        })
    }
    /**
    * creates a chipotle object. also logs into the specified chipotle account with login()
    * @param {string} email - the account email
    * @param {string} password - the account password
    * @param {boolean} headless - whether to start the browser in headless mode or not
    * @param {number=5} maxAttempts - the max amount of login retry attempts. default 5
    */
    static async create(email: string, password: string, headless: boolean, maxAttempts: number = 5): Promise<Chipotle> {
        const obj = new Chipotle()

        obj.browser = await puppeteer.launch({ headless: headless })
        obj.mainPage = await obj.browser.newPage()
        obj.mainPage.setViewport({
            width: 1167,
            height: 821
        })
        await obj.mainPage.setUserAgent(obj.userAgent)
        await obj.login(email, password, maxAttempts)

        return obj
    }
}

export = Chipotle

