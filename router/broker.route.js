import express from 'express';
import { angelonelogin} from '../controller/angelone.controller.js';
import { zerodhalogin } from '../controller/zerodha.controller.js';
// import { zerodhaholdings } from '../controller/zerodha.controller.js';

const brokerRouter = express.Router();

brokerRouter.post('/angelonelogin', angelonelogin) // 👈 This tells Express to run your code when a POST request is made to /angelonelogin
brokerRouter.post('/zerodhalogin',zerodhalogin)
// brokerRouter.post('/zerodhaholdings',zerodhaholdings)

export default brokerRouter;