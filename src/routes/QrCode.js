import express from "express"
import { getQRCode, newQrCode } from "../controller/QrCode.js";
const route = express.Router()

route.post('/new', newQrCode);
route.get('/:qrCodeId', getQRCode)

export default route