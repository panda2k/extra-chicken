import Chipotle from './index'
import config from '../config.json'
import { CreateOrderContent, CreateOrderEntree } from './types'
import { TwoFactorRequired } from './errors'

const HEADLESS = false

const test = async () => {
    const chip = await Chipotle.create(config.email, config.password, false)
    console.log(chip.getToken)
    const restaurants = await chip.searchRestaurants(47.717020399999996, -122.3009337, 80467)
    console.log(restaurants[0].restaurantName)
    const menu = await chip.getRestaurantMenu(restaurants[0].restaurantNumber)
    console.log(menu.entrees[0].itemName)

    const [order, eTag] = await chip.createOrder(restaurants[0].restaurantNumber)
    console.log(eTag)
    const [response, eTag2] = await chip.addItemToCart(order.orderId, eTag, "test", [config.testOrder] as CreateOrderEntree[], [config.testOrderSide] as CreateOrderContent[], [])
    console.log(eTag2)
    console.log(response.mealId)
    const [addUtensils, eTag3] = await chip.addUtensilsToOrder(order.orderId, eTag2)
    console.log(addUtensils.nonFoodItemId)
    console.log(eTag3)
    const pickupTimes = await chip.getRestaurantPickupTimes(restaurants[0].restaurantNumber)
    console.log(pickupTimes[0])
    const wallet = await chip.getWallet()
    console.log(wallet[0].paymentMethod)
    await chip.browserAtc(config.testOrder as CreateOrderEntree, [], [config.testOrderSide] as CreateOrderContent[], "test", true)
    await chip.changeStoredOrder(eTag3, addUtensils.order)

    const lastFour = config.live ? config.realCardLastFour : config.testCardLastFour
    const orderResult = await chip.browserCheckout(pickupTimes[0], lastFour)
    console.log(orderResult)

}

test()
    .catch(error => {
        if (error instanceof TwoFactorRequired && !HEADLESS) {
            console.log('Solve two factor and restart tests')
        } else if (!HEADLESS) { // dont pass error up if in non-headless so I can debug
            console.log(error)
        } else {
            throw error
        }
    })

