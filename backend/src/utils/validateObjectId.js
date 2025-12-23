import mongoose from "mongoose";
import { ApiError } from "./ApiError.js";

export const validateObjectId = (id, name = "id") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${name}`);
  }
};
