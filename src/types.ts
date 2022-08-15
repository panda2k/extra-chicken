type YesNo = "Y" | "N"

export interface CheckoutError {
    errorCode: string,
    errorDescription: string,
    errorData: Object
}

export interface Restaurant {
    restaurantNumber: number,
    restaurantName: string,
    restaurantLocationType: string,
    restaurantStatus: string,
    openDate: string,
    realEstateCategory: string,
    operationalRegion: string,
    operationalSubRegion: string,
    operationalPatch: string,
    designatedMarketAreaName: string,
    distance: number,
    addresses: {
        addressType: string,
        addressLine1: string,
        locality: string,
        administrativeArea: string,
        postalCode: string,
        countryCode: string,
        latitude: number,
        logitude: number,
        accuracyDetermination: string,
    }[],
    directions: {
        crossStreet1: string,
        crossStreet2: string,
        pickupInstructions: string
    },
    timezone: {
        currentTimezoneOffset: number,
        timezoneOffset: number
        timezone: string,
        timezoneId: string,
        observeDaylightSavings: YesNo
        daylightSavingsOffset: number
    },
    marketing: {
        operationsMarket: string,
        specialMenuPanelInstructions: string,
        featureMenuPanel: string,
        kidsMenuPanel: YesNo,
        caloriesOnMenuPanel: YesNo,
        foodWithIntegrityMenuBoardWidthId: string,
        menuBoardPanelHeightId: string,
        alcoholCategory: string,
        alcoholCategoryDescription: string,
        marketingAlcoholDescription: string,
        realHours: {
            dayOfWeek: string,
            openDateTime: string,
            closeDateTime: string
        }[],
        onlineOrdering: {
            onlineOrderingEnabled: boolean,
            onlineOrderingDotComSearchEnabled: string,
            onlineOrderingCreditCardsAccepted: boolean,
            onlineOrderingGiftCardsAccepted: boolean,
            onlineOrderingBulkOrdersAccepted: boolean,
            onlineOrderingTaxAssesed: boolean,
            restaurantTerminalSiteId: number
        },
        catering: {
            cateringEnabled: boolean
        },
        chipotlane: {
            chipotlanePickupEnabled: boolean
        },
        experience: {
            curbsidePickupEnabled: boolean,
            diningRoomOpen: boolean,
            digitalKitchen: boolean,
            walkupWindowEnabled: boolean,
            pickupInsideEnabled: boolean
        },
        sustainability: {
            utensilsDetfaultState: string
        }
    }
}

export interface SearchRestaurantResponse {
    data: Restaurant[]
}

export interface ContentGroup {
    contentGroupname: string,
    minQuantity: number,
    maxQuantity: number
}

export interface Content {
    itemType: string,
    itemId: string,
    itemName: string,
    posId: number,
    unitPrice: number,
    unitDeliveryPrice: number,
    unitCount: number,
    eligibleForDelivery: boolean,
    pricingReferenceItemId: string | null,
    countTowardsCustomizationMax: number,
    countTowardsContentMax: number,
    defaultContent: boolean,
    contentGroupname: string,
    isItemAvailable: boolean,
    customizations: Customization[]
}

export interface Customization {
    id: number,
    name: string,
    countTowardsCustomizationMax: number,
    countTowardsContentMax: number
}

export interface Entree extends MenuItem {
    primaryFillingName: string,
    unitPrice: number,
    unitDeliveryPrice: number,
    unitCount: number,
    maxQuantity: number,
    maxContents: number,
    maxCustomizations: number,
    maxExtras: number,
    maxHalfs: number,
    maxExtrasPlusHalfs: number,
    contentGroups: ContentGroup[],
    contents: Content[]
}

export interface MenuItem {
    itemCategory: string,
    itemType: string,
    itemId: string,
    itemName: string,
    posId: number,
    unitPrice: number,
    unitDeliveryPrice: number,
    unitCount: number,
    maxQuantity: number,
    eligibleForDelivery: boolean,
    isUniversal: boolean,
    isItemAvailable: boolean
}

export interface GetMenuResponse {
    restaurantId: number,
    entrees: Entree[],
    sides: MenuItem[],
    drinks: MenuItem[],
    nonFoodItems: MenuItem[]
}

export interface Order {
    orderId: string,
    restaurantId: number,
    orderDateTimeLocal: string | null,
    pickupDateTimeLocal: string | null,
    bagPickupLocationId: string | null,
    isOrderComplete: boolean,
    orderType: number,
    orderStatus: string,
    orderShortCode: string,
    orderMealsUnitPrice: number,
    orderMealsSubTotalAmount: number,
    orderFeeAmount: number,
    orderDonationAmount: number,
    orderPreDiscountSubTotalAmount: number,
    orderDiscountAmount: number,
    orderSubTotalAmount: number,
    orderTaxAmount: number,
    orderTipAmount: number,
    orderTotalAmount: number,
    taxWasCalculated: boolean,
    discountsWereCalculated: boolean,
    discountErrorCode: string | null,
    discountErrorContent: string | null,
    deliveryFeeObtained: boolean,
    isOrderActuallyEligibleForDelivery: boolean,
    isOrderPotentiallyEligibleForDelivery: boolean,
    isOrderAvailable: boolean,
    isAboveStorePayment: boolean,
    meals: null | Meal[],
    discounts: string | null,
    delivery: string | null,
    taxesAndFees: {
        taxAndFeeTotal: number,
        tax: number,
        deliveryServiceFee: number,
    },
    groupOrderId: null | string,
    groupOrderMessage: null | string,
    customerFirstName: string,
    donations: null | string,
    nonFoodItems: null | string,
    payments: null | string // string not confirmed for null | string items
}

export interface CreateOrderResponse {
    orderId: string,
    order: Order
}

export interface CreateOrderEntree {
    menuItemId: string,
    menuItemName: string,
    quantity: number,
    contents: CreateOrderContent[],
}

export interface CreateOrderContent {
    menuItemId: string,
    menuItemName: string,
    quantity: number,
    isUpSell: boolean
    customizationId?: number
}

export interface AddToOrderResponse {
    mealId: string,
    swappedEntrees: null | string,
    order: Order
}

export interface Meal {
    mealId: string,
    mealName: string,
    preconfiguredMealId: null | string,
    preconfiguredMealName: null | string,
    mealUnitPrice: number,
    mealExtendedPrice: number,
    mealDiscountAmount: number,
    mealSubTotalAmount: number,
    mealTaxAmount: number,
    mealTotalAmount: number,
    isMealAvailable: boolean,
    isHostMeal: boolean,
    wasMealModified: boolean,
    entrees: EntreeContent[],
    sides: SideContent[],
    drinks: SideContent[]
}

export interface MealContent {
    menuItemId: string,
    menuItemName: string,
    quantity: number,
    customizationId: number,
    itemUnitPrice: number,
    itemExtendedPrice: number,
    itemDiscountAmount: number,
    itemSubTotalAmount: number,
    itemTaxAmount: number,
    itemTotalAmount: number,
    isItemAvailable: boolean
}

export interface EntreeContent extends MealContent {
    entreeContentId: string
}

export interface SideContent extends MealContent {
    sideId: string,
    isUpSell: boolean,
    preconfiguredItemName: null | string
}

export interface AddUtensilsResponse {
    nonFoodItemId: string,
    order: Order
}

export interface ShapeHeaders {
    "x-ep1cc1qk-a": string,
    "x-ep1cc1qk-b": string,
    "x-ep1cc1qk-c": string,
    "x-ep1cc1qk-d": string,
    "x-ep1cc1qk-f": string,
    "x-ep1cc1qk-z": string,
}

export interface Wallet {
    tokenId: number,
    tokenizedAccountNumber: string,
    expiration: string,
    cardHolderName: string,
    paymentMethod: string,
    billingAddress: string,
    billingCity: string,
    billingStateProvince: string,
    billingZip: string,
    billingCountry: string,
    paymentTypeId: number,
    paymentProviderDbId: number,
    paymentProviderId: string,
    lastFourAccountNumbers: string,
    isSingleUse: boolean,
    customerId: number,
    isGiftCard: boolean,
    expirationMonth: string,
    expirationYear: string
}

