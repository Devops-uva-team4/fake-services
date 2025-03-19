const { v4: uuidv4 } = require('uuid');
const express = require("express");
const app = express();

////////////////////////////////////
// FAKE SEAT RESERVATION SERVICE
////////////////////////////////////

const { ZBClient } = require("zeebe-node");
require("dotenv").config();

const zeebeClient = new ZBClient();
const worker = zeebeClient.createWorker('reserve-seats', reserveSeatsHandler);

function reserveSeatsHandler(job, _, worker) {
  console.log("\n\n Reserve seats now...");
  console.log(job);

  if ("seats" !== job.variables.simulateBookingFailure) {
    console.log("Successul :-)");
    return job.complete({
      reservationId: "1234",
    });
  } else {
    console.log("ERROR: Seats could not be reserved!");
    return job.error("ErrorSeatsNotAvailable");
  }
}

////////////////////////////////////
// FAKE PAYMENT SERVICE
////////////////////////////////////
const amqp = require('amqplib/callback_api');

const queuePaymentRequest = 'paymentRequest';
const queuePaymentResponse = 'paymentResponse';

const rabbitmqUser = process.env.RABBITMQ_USER || "guest";
const rabbitmqPass = process.env.RABBITMQ_PASS || "guest";
const rabbitmqHost = process.env.RABBITMQ_HOST || "rabbitmq";

const amqpUrl = `amqp://${rabbitmqUser}:${rabbitmqPass}@${rabbitmqHost}`;

amqp.connect(amqpUrl, function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }

    channel.assertQueue(queuePaymentRequest, { durable: true });
    channel.assertQueue(queuePaymentResponse, { durable: true });

    channel.consume(queuePaymentRequest, function(inputMessage) {
      const paymentRequestId = inputMessage.content.toString();
      const paymentConfirmationId = uuidv4();

      console.log("\n\n [x] Received payment request %s", paymentRequestId);

      const outputMessage = `{"paymentRequestId": "${paymentRequestId}", "paymentConfirmationId": "${paymentConfirmationId}"}`;

      channel.sendToQueue(queuePaymentResponse, Buffer.from(outputMessage));
      console.log(" [x] Sent payment response %s", outputMessage);
    }, {
      noAck: true
    });
  });
});

////////////////////////////////////
// FAKE TICKET GENERATION SERVICE + HEALTH CHECK
////////////////////////////////////

// Health endpoint for Kubernetes probes
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Existing ticket generation endpoint
app.get("/ticket", (req, res, next) => {
  const ticketId = uuidv4();
  console.log("\n\n [x] Create Ticket %s", ticketId);
  res.json({"ticketId": ticketId});
});

app.listen(3000, () => {
  console.log("HTTP Server running on port 3000");
});
