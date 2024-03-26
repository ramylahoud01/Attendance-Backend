import QrCode from "../model/QrCode.js";

export const newQrCode = async (req, res, next) => {
    try {
        const { Content } = req.body;

        const newQrCode = new QrCode({
            Content
        });

        const savedQrCode = await newQrCode.save();

        res.status(201).json(savedQrCode);
    } catch (error) {
        next(error)
    }
}
export const getQRCode = async (req, res, next) => {
    try {
        const qrCodeId = req.params.qrCodeId; // Assuming you are passing the QR code ID in the URL
        const qrCode = await QrCode.findById(qrCodeId);

        if (!qrCode) {
            return res.status(404).json({ message: "QR code not found" });
        }

        const base64Data = qrCode.Content.toString('base64');

        res.status(200).json({ qrCode: base64Data });
    } catch (error) {
        // Handle errors
        next(error);
    }
};
