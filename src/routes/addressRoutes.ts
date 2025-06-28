import address from "../controllers/addressController";
import { Router } from "express";

const router = Router();

router.route("/create").post(address.createAddress);
router.route("/list").get(address.getAllAddresses);
router.route("/details/:id").get(address.getAddressById);
router.route("/update/:id").put(address.updateAddress);
router.route("/remove/:id").delete(address.deleteAddress);
router.route("/set-default/:id").patch(address.setDefaultAddress);

export default router;
