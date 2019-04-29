const functions = require('firebase-functions');
const admin = require('firebase-admin');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
admin.initializeApp(functions.config().firebase);

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Firebase!");
});

exports.makeOrder = functions.https.onRequest((request, response) => {

    const partId = request.query.part_id;
    const partName = request.query.part_name;
    const buyerId = request.query.buyer_id;
    const buyerName = request.query.buyer_name;
    const sellerId = request.query.seller_id;
    const sellerName = request.query.seller_name;
    const quantity = request.query.quantity;
    const location = request.query.location;
    const imageUrl = request.query.image_url;
    const date = request.query.time;

    const description = quantity + " " + partName;

    var partRef = admin.firestore().collection('parts').doc(partId);
    var res = null;

    return partRef.get().then(doc => {

        if(!doc) {
            console.log("Part " + partId + " not found");

            res = {resultCode:-1, description:'Product does not exist'};
            return response.status(200).json(res);

        } else {
            var part = doc.data();
            var available = part.quantity;

            if(quantity > available) {
                res = {resultCode:-1, description:'Quantity exceeds available amount', quantity:quantity, available:available};
                return response.status(200).json(res);

            } else {
                available = available - quantity;
                var order = {id:buyerId+partId, name:partName, buyerId:buyerId, buyerName:buyerName, sellerId:sellerId, sellerName:sellerName, date:date, image:imageUrl, description:description, location:location}

                admin.database().ref('orders').child(sellerId).child(partId).set(order);
                admin.database().ref('requests').child(buyerId).child(order.id).set(order);
                partRef.update({quantity:available});

                res = {buyer_id:buyerId, resultCode:0,description:'Order created succesfully', seller:sellerName, available:String(available)};
                return response.status(200).json(res);
            }
        }

    });

});

exports.bookTestDrive = functions.https.onRequest((request, response) => {

    const carId = request.query.car_id;
    const carName = request.query.car_name;
    const bookerId = request.query.booker_id;
    const bookerName = request.query.booker_name;
    const sellerId = request.query.seller_id;
    const sellerName = request.query.seller_name;
    const dateBooked = request.query.date_booked;
    const timeBooked = request.query.time_booked;
    const imageUrl = request.query.image_url;
    const date = request.query.time;

    var carRef = admin.firestore().collection('cars').doc(carId);
    var res = null;

    return carRef.get().then(doc => {

        if(!doc) {
            console.log("Car " + carId + " not found");

            res = {resultCode:-1, description:'Car does not exist'};
            return response.status(200).json(res);

        } else {
            var car = doc.data();

            var booking = {id:bookerId+carId, name:carName, bookerId:bookerId, bookerName:bookerName, sellerId:sellerId, sellerName:sellerName, dateBooked:dateBooked, timeBooked:timeBooked, image:imageUrl}

            admin.database().ref('bookings').child(sellerId).child(carId).set(booking);
            admin.database().ref('test-drives').child(bookerId).child(booking.id).set(booking);

            res = {booker_id:bookerId, resultCode:0,description:'Booking created succesfully', seller:sellerName};
            return response.status(200).json(res);
        
        }

    });

});

exports.getReports = functions.https.onRequest((request, response) => {
    const minDate = request.query.minDate;
    const maxDate = request.query.maxDate;
    const uid = request.query.uid;

    var carsSold = 0;
    var partsSold = 0;
    var totalAmount = 0;

    var toyotaCount = 0;
    var mazdaCount = 0;
    var subaruCount = 0;
    var hondaCount = 0;
    var benzCount = 0;
    var bmwCount = 0;

    var res = null;

    for(var i = minDate; i <= maxDate; i++) {

        admin.database().ref('reports').child(uid).child(i).once('value').then(snap => {
            const report = snap.val();
            console.log("Month " + i);
            console.log("Report: " + report);

            if(!report) {
                return;
            } else {
                carsSold += report.carsSold;
                partsSold += report.partsSold;
                totalAmount += report.totalAmount;

            }

        });
    }

    res = {cars_sold:carsSold, parts_sold:partsSold, amount_sold:totalAmount};
    return response.status(200).json(res);

});

function isWithinRange(value, min, max) {
    if (value >= min && value <= max) {
        return true;
    }
      return false;
}