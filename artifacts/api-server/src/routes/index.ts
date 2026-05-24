import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import businessesRouter from "./businesses";
import offersRouter from "./offers";
import slotsRouter from "./slots";
import bookingsRouter from "./bookings";
import dashboardRouter from "./dashboard";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(businessesRouter);
router.use(offersRouter);
router.use(slotsRouter);
router.use(bookingsRouter);
router.use(dashboardRouter);
router.use(publicRouter);

export default router;
