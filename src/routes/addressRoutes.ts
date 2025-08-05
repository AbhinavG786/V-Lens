import address from "../controllers/addressController";
import firebaseAuth from "../middlewares/firebaseAuth";
import { Router } from "express";

const router = Router();

router.route("/create").post(firebaseAuth.verifySessionCookie,address.createAddress);
router.route("/list").get(firebaseAuth.verifySessionCookie,address.getAllAddressesForUser);
router.route("/details/:id").get(firebaseAuth.verifySessionCookie,address.getAddressById);
router.route("/update/:id").put(firebaseAuth.verifySessionCookie,address.updateAddress);
router.route("/remove/:id").delete(firebaseAuth.verifySessionCookie,address.deleteAddress);
router.route("/set-default/:id").patch(firebaseAuth.verifySessionCookie,address.setDefaultAddress);

export default router;
