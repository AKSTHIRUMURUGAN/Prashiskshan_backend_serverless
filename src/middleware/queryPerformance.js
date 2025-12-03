import mongoose from "mongoose";
import { logger } from "../utils/logger.js";
import creditMetricsService from "../services/creditMetricsService.js";

/**
 * Mongoose plugin to track query performance
 * Logs slow queries and tracks metrics
 */
export const queryPerformancePlugin = (schema) => {
  // Track query execution time
  schema.pre(/^find/, function (next) {
    this._startTime = Date.now();
    next();
  });

  schema.post(/^find/, function (result) {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const queryName = `${this.model.modelName}.${this.op}`;
      
      // Track in metrics service
      creditMetricsService.trackDatabaseQuery(queryName, duration, {
        model: this.model.modelName,
        operation: this.op,
      });

      // Log slow queries (> 1000ms)
      if (duration > 1000) {
        logger.warn("Slow query detected", {
          model: this.model.modelName,
          operation: this.op,
          duration: `${duration}ms`,
          query: JSON.stringify(this.getQuery()),
        });
      }
    }
  });

  // Track save operations
  schema.pre("save", function (next) {
    this._startTime = Date.now();
    next();
  });

  schema.post("save", function () {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const queryName = `${this.constructor.modelName}.save`;
      
      creditMetricsService.trackDatabaseQuery(queryName, duration, {
        model: this.constructor.modelName,
        operation: "save",
      });

      if (duration > 1000) {
        logger.warn("Slow save operation detected", {
          model: this.constructor.modelName,
          operation: "save",
          duration: `${duration}ms`,
        });
      }
    }
  });

  // Track update operations
  schema.pre(/^update/, function (next) {
    this._startTime = Date.now();
    next();
  });

  schema.post(/^update/, function () {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const queryName = `${this.model.modelName}.${this.op}`;
      
      creditMetricsService.trackDatabaseQuery(queryName, duration, {
        model: this.model.modelName,
        operation: this.op,
      });

      if (duration > 1000) {
        logger.warn("Slow update operation detected", {
          model: this.model.modelName,
          operation: this.op,
          duration: `${duration}ms`,
        });
      }
    }
  });

  // Track delete operations
  schema.pre(/^delete|^remove/, function (next) {
    this._startTime = Date.now();
    next();
  });

  schema.post(/^delete|^remove/, function () {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const queryName = `${this.model.modelName}.${this.op}`;
      
      creditMetricsService.trackDatabaseQuery(queryName, duration, {
        model: this.model.modelName,
        operation: this.op,
      });

      if (duration > 1000) {
        logger.warn("Slow delete operation detected", {
          model: this.model.modelName,
          operation: this.op,
          duration: `${duration}ms`,
        });
      }
    }
  });

  // Track aggregate operations
  schema.pre("aggregate", function (next) {
    this._startTime = Date.now();
    next();
  });

  schema.post("aggregate", function () {
    if (this._startTime) {
      const duration = Date.now() - this._startTime;
      const queryName = `${this._model.modelName}.aggregate`;
      
      creditMetricsService.trackDatabaseQuery(queryName, duration, {
        model: this._model.modelName,
        operation: "aggregate",
      });

      if (duration > 1000) {
        logger.warn("Slow aggregate operation detected", {
          model: this._model.modelName,
          operation: "aggregate",
          duration: `${duration}ms`,
        });
      }
    }
  });
};

/**
 * Apply query performance tracking to CreditRequest model
 */
export const applyCreditRequestPerformanceTracking = () => {
  try {
    const CreditRequest = mongoose.model("CreditRequest");
    if (CreditRequest && CreditRequest.schema) {
      CreditRequest.schema.plugin(queryPerformancePlugin);
      logger.info("Query performance tracking applied to CreditRequest model");
    }
  } catch (error) {
    logger.warn("Could not apply query performance tracking to CreditRequest model", {
      error: error.message,
    });
  }
};

export default queryPerformancePlugin;
