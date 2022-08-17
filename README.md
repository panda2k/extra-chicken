# Extra Chicken - An unofficial Chipotle API wrapper
Extra chicken is an unofficial Chipotle API wrapper that allows you to programatically interact
with the Chipotle website to view stores, menus, place orders, and more.

## Table of Contents
[Installation](#Installation)

[Usage Examples](#Usage-Examples)

[API Documentation](#API-Documentation)

## Installation 
`npm install extra-chicken`

## Usage Examples
### Initialize Chipotle Object
```
import Chipotle from 'extra-chicken' 

// creates a non-headless puppeteer instance that logs into the Chipotle site with the specified credentials
const chip = await Chipotle.create("account-email@gmail.com", "account-password", false)
```

### Fetch the closest restaurant and get its menu
```
lat = 0 
long = 0
proximity = 10000
restaurants = await chip.searchRestaurants(lat, long, proximity)
const closestRestaurant = restaurants[0]
const menu = await chip.getRestaurantMenu(closestRestaurant.restaurantNumber)
```

### Add Cart Items and Checkout
#### Notes about the cart and checkout process
* Chipotle checkout requires the use of a saved credit card. Make sure you
have a credit card saved on your Chipotle account if you plan to use
automated checkout.


* Chipotle carts use [ETags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag)
which are returned in a header with every cart related action. 
All cart/order related methods will return an array with the first element
being the data and the second element is the ETag required to continue
modifying the cart.
```
const restaurantId = 3171
const [order, eTag] = await chip.createOrder(restaurantId) 
const [atcResponse, eTag2] = await chip.addItemToCart(
    order.orderId, 
    eTag, 
    "test", 
    [{ 
       "menuItemId":"CMG-101",
		"menuItemName":"Chicken Bowl",
		"quantity":1,
		"contents":[
		   {
			  "menuItemId":"CMG-5101",
			  "menuItemName":"Fajita Veggies",
			  "quantity":1,
			  "isUpSell":false,
			  "customizationId":2
		   },
		   {
			  "menuItemId":"CMG-5002",
			  "menuItemName":"Brown Rice",
			  "quantity":1,
			  "isUpSell":false,
			  "customizationId":2
		   },
		   {
			  "menuItemId":"CMG-5051",
			  "menuItemName":"Black Beans",
			  "quantity":1,
			  "isUpSell":false,
			  "customizationId":2
		   }
    }] as CreateOrderEntree[],
    [{
      "menuItemId": "CMG-4025",
		"menuItemName": "Tortilla on the Side",
		"quantity": 1,
		"isUpSell": false
    }] as CreateOrderContent[],
    [{
        "menuItemId":"CMG-2019",
        "menuItemName":"22 fl oz Tractor Organic Watermelon Limeade",
        "quantity":1,
        "isUpSell":false
    }] as CreateOrderContent[]
)
const [addUtensilsResponse, eTag3] = await chip.addUtensilsToOrder(order.orderId, eTag2)
// set the browser's stored order 
await chip.changeStoredOrder(eTag3, addUtensilsResponse.order) 

// poll pickup times 
const pickupTimes = await chip.getRestaurantPickupTimes(restaurantId)
// checkout order and pickup ASAP and pay with the card ending in 5432
const orderResult = await chip.browserCheckout(pickupTimes[0], "5432") 
```
## API Documentation
<a name="Chipotle"></a>

### Chipotle
The class representing the Chipotle API wrapper.

**Kind**: global class  

* [Chipotle](#Chipotle)
    * _instance_
        * [.getToken()](#Chipotle+getToken) ⇒ `string`
        * [.setUserAgent(userAgent)](#Chipotle+setUserAgent)
        * [.searchRestaurants(latitude, longitude, searchRadius)](#Chipotle+searchRestaurants) ⇒ `Array<Restaurant>`
        * [.getRestaurantMenu(restaurantId)](#Chipotle+getRestaurantMenu) ⇒ `GetMenuResponse`
        * [.createOrder(restaurantId)](#Chipotle+createOrder) ⇒ `Array<{order: Order, eTag: string}>`
        * [.addItemToCart(orderId, eTag, mealName, entrees, sides, drinks)](#Chipotle+addItemToCart) ⇒ `Array<{addToOrderResponse: AddToOrderResponse, eTag: string}>`
        * [.addUtensilsToOrder(orderId, eTag)](#Chipotle+addUtensilsToOrder) ⇒ `Array<{addUtensilsResponse: AddUtensilsResponse, ETag: string}>`
        * [.getWallet()](#Chipotle+getWallet) ⇒ `Array<Wallet>`
        * [.getRestaurantPickupTimes(restaurantId)](#Chipotle+getRestaurantPickupTimes) ⇒ `Array<string>`
        * [.changeStoredOrder(eTag, order)](#Chipotle+changeStoredOrder)
        * [.browserAtc(entree, drinks, sides, mealName, utensils)](#Chipotle+browserAtc)
        * [.browserCheckout(pickupTime, cardLastFour)](#Chipotle+browserCheckout) ⇒ `string` \| `Array<CheckoutError>`
        * [.checkout(orderId, eTag, shapeHeaders, wallet, pickupTime)](#Chipotle+checkout) ⇒ `AxiosResponse`
        * [.login(email, password, [maxAttempts])](#Chipotle+login)
    * _static_
        * [.create(email, password, headless, [maxAttempts])](#Chipotle.create)

<a name="Chipotle+getToken"></a>

#### chipotle.getToken() ⇒ `string`
Gets the JWT token associated with the object.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `string` - The JWT token.  
<a name="Chipotle+setUserAgent"></a>

#### chipotle.setUserAgent(userAgent)
Sets the browser's user agent.

**Kind**: instance method of [`Chipotle`](#Chipotle)  

| Param | Type | Description |
| --- | --- | --- |
| userAgent | `string` | The user agent. |

<a name="Chipotle+searchRestaurants"></a>

#### chipotle.searchRestaurants(latitude, longitude, searchRadius) ⇒ `Array<Restaurant>`
Searches for Chipotles near a lat long.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `Array<Restaurant>` - A list of restaurants near the location provided.  

| Param | Type | Description |
| --- | --- | --- |
| latitude | `number` | The latitude of the location to search in. |
| longitude | `number` | The longitude of the location to search in. |
| searchRadius | `number` | The search radius. Unknown unit. Might be feet? |

<a name="Chipotle+getRestaurantMenu"></a>

#### chipotle.getRestaurantMenu(restaurantId) ⇒ `GetMenuResponse`
Gets a restaurant's menu.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `GetMenuResponse` - A response object containing the menu and store id.  

| Param | Type | Description |
| --- | --- | --- |
| restaurantId | `number` | The id number of the restaurant. |

<a name="Chipotle+createOrder"></a>

#### chipotle.createOrder(restaurantId) ⇒ `Array<{order: Order, eTag: string}>`
Creates an empty order.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `Array<{order: Order, eTag: string}>` - An order object as well as the associated ETag. The ETag is required to modify the order further (e.g. atc).  

| Param | Type | Description |
| --- | --- | --- |
| restaurantId | `number` | The id number of the desired restaurant. |

<a name="Chipotle+addItemToCart"></a>

#### chipotle.addItemToCart(orderId, eTag, mealName, entrees, sides, drinks) ⇒ `Array<{addToOrderResponse: AddToOrderResponse, eTag: string}>`
Adds item(s) to the specified cart.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `Array<{addToOrderResponse: AddToOrderResponse, eTag: string}>` - A response body containing the mealId, order contents, and swapped entrees. The second return value is the ETag.  

| Param | Type | Description |
| --- | --- | --- |
| orderId | `string` | The target order id. |
| eTag | `string` | The most recent ETag associated with the order. This is returned from createOrder and all order related methods. |
| mealName | `string` | The name of the meal. This is commonly the customers name. |
| entrees | `Array<CreateOrderEntree>` | An array of entrees to add to the order. |
| sides | `Array<CreateOrderContent>` | An array of sides to add to the order. |
| drinks | `Array<CreateOrderContent>` | An array of drinks to add to the order. |

<a name="Chipotle+addUtensilsToOrder"></a>

#### chipotle.addUtensilsToOrder(orderId, eTag) ⇒ `Array<{addUtensilsResponse: AddUtensilsResponse, ETag: string}>`
Adds utensils to an order.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `Array<{addUtensilsResponse: AddUtensilsResponse, ETag: string}>` - A response body containing the utensil item id and the order body.  

| Param | Type | Description |
| --- | --- | --- |
| orderId | `string` | The target order id. |
| eTag | `string` | The most recent ETag associated with the order. This is returned from createOrder and all order related methods. |

<a name="Chipotle+getWallet"></a>

#### chipotle.getWallet() ⇒ `Array<Wallet>`
Gets a list of saved payment methods.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `Array<Wallet>` - A list of saved payment methods.  
<a name="Chipotle+getRestaurantPickupTimes"></a>

#### chipotle.getRestaurantPickupTimes(restaurantId) ⇒ `Array<string>`
Gets a list of available pickup times at a specified restaurant.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `Array<string>` - An array of pickup times. The time is formatted YYYY-MM-DDTHH:MM:SS.  

| Param | Type | Description |
| --- | --- | --- |
| restaurantId | `number` | The id of the target restaurant. |

<a name="Chipotle+changeStoredOrder"></a>

#### chipotle.changeStoredOrder(eTag, order)
Changes the stored order data on the browser instance.

**Kind**: instance method of [`Chipotle`](#Chipotle)  

| Param | Type | Description |
| --- | --- | --- |
| eTag | `string` | The most recent ETag associated with the order. |
| order | `Order` | The order body to save. |

<a name="Chipotle+browserAtc"></a>

#### chipotle.browserAtc(entree, drinks, sides, mealName, utensils)
Adds an entree + sides + drinks to cart using the browser. Not recommended to use over the changeStoredOrder and addItemToCart methods beucase it's prone to runtime errors and is slower than alternative methods.

**Kind**: instance method of [`Chipotle`](#Chipotle)  

| Param | Type | Description |
| --- | --- | --- |
| entree | `CreateOrderEntree` | The entree object to add. |
| drinks | `Array<CreateOrderContent>` | An array of drink objects to add. |
| sides | `Array<CreateOrderContent>` | An array of side objects to add. |
| mealName | `string` | The name of the meal. Typically the customer's name. |
| utensils | `boolean` | Whether to add utensils to the order. |

<a name="Chipotle+browserCheckout"></a>

#### chipotle.browserCheckout(pickupTime, cardLastFour) ⇒ `string` \| `Array<CheckoutError>`
Checks out the browser instance's current cart.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `string` \| `Array<CheckoutError>` - An array of checkout errors or a success message.  

| Param | Type | Description |
| --- | --- | --- |
| pickupTime | `string` | The order pickup time. This should be in the same format returned in getRestaurantPickupTimes (YYYY-MM-DDTHH:MM:SS). |
| cardLastFour | `string` | The last four digits of the saved credit card. |

<a name="Chipotle+checkout"></a>

#### chipotle.checkout(orderId, eTag, shapeHeaders, wallet, pickupTime) ⇒ `AxiosResponse`
Checks out a specified order. Requires shape antibot headers. I don't have access to a shape cookie api so the function is largely undocumented.

**Kind**: instance method of [`Chipotle`](#Chipotle)  
**Returns**: `AxiosResponse` - Returns a response object instead of just the body for debugging purposes.  

| Param | Type | Description |
| --- | --- | --- |
| orderId | `string` | The target order id. |
| eTag | `string` | The most recent ETag associated with the order. |
| shapeHeaders | `ShapeHeaders` | An object of shape antibot headers required for order submissions. |
| wallet | `Wallet` | The payment method wallet object returned from getWallet. |
| pickupTime | `string` | The order pickup time. This should be in the same format returned in getRestaurantPickupTimes (YYYY-MM-DDTHH:MM:SS). |

<a name="Chipotle+login"></a>

#### chipotle.login(email, password, [maxAttempts])
Logs the browser instance into a Chipotle account.

**Kind**: instance method of [`Chipotle`](#Chipotle)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| email | `string` |  | The account email. |
| password | `string` |  | The account password. |
| [maxAttempts] | `number` | `5` | The max amount of login retry attempts. Default is 5 attempts. |

<a name="Chipotle.create"></a>

#### Chipotle.create(email, password, headless, [maxAttempts])
Creates a Chipotle object. Also logs into the specified chipotle account with login().

**Kind**: static method of [`Chipotle`](#Chipotle)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| email | `string` |  | The account email. |
| password | `string` |  | The account password. |
| headless | `boolean` |  | Whether to start the browser in headless mode or not. |
| [maxAttempts] | `number` | `5` | The max amount of login retry attempts. default is 5 attempts. |

