import * as tslib_1 from "tslib";
import { getCurrentHub } from '@sentry/core';
import { Severity } from '@sentry/types';
import { addExceptionTypeValue, isPrimitive, isString, keysToEventMessage, logger, normalize, normalizeToSize, truncate, } from '@sentry/utils';
import { shouldIgnoreOnError } from '../helpers';
import { eventFromStacktrace } from '../parsers';
import { _installGlobalHandler, _installGlobalUnhandledRejectionHandler, _subscribe, } from '../tracekit';
/** Global handlers */
var GlobalHandlers = /** @class */ (function () {
    /** JSDoc */
    function GlobalHandlers(options) {
        /**
         * @inheritDoc
         */
        this.name = GlobalHandlers.id;
        this._options = tslib_1.__assign({ onerror: true, onunhandledrejection: true }, options);
    }
    /**
     * @inheritDoc
     */
    GlobalHandlers.prototype.setupOnce = function () {
        Error.stackTraceLimit = 50;
        _subscribe(function (stack, _, error) {
            var isFailedOwnDelivery = error && error.__sentry_own_request__ === true;
            if (shouldIgnoreOnError() || isFailedOwnDelivery) {
                return;
            }
            var self = getCurrentHub().getIntegration(GlobalHandlers);
            if (self) {
                getCurrentHub().captureEvent(self._eventFromGlobalHandler(stack, error), {
                    data: { stack: stack },
                    originalException: error,
                });
            }
        });
        if (this._options.onerror) {
            logger.log('Global Handler attached: onerror');
            _installGlobalHandler();
        }
        if (this._options.onunhandledrejection) {
            logger.log('Global Handler attached: onunhandledrejection');
            _installGlobalUnhandledRejectionHandler();
        }
    };
    /**
     * This function creates an Event from an TraceKitStackTrace.
     *
     * @param stacktrace TraceKitStackTrace to be converted to an Event.
     */
    GlobalHandlers.prototype._eventFromGlobalHandler = function (stacktrace, error) {
        if (!isString(stacktrace.message) && stacktrace.mechanism !== 'onunhandledrejection') {
            // There are cases where stacktrace.message is an Event object
            // https://github.com/getsentry/sentry-javascript/issues/1949
            // In this specific case we try to extract stacktrace.message.error.message
            var message = stacktrace.message;
            stacktrace.message =
                message.error && isString(message.error.message) ? message.error.message : 'No error message';
        }
        if (stacktrace.mechanism === 'onunhandledrejection' && (stacktrace.incomplete || stacktrace.mode === 'failed')) {
            return this._eventFromIncompleteRejection(stacktrace, error);
        }
        var event = eventFromStacktrace(stacktrace);
        var data = {
            mode: stacktrace.mode,
        };
        if (stacktrace.message) {
            data.message = stacktrace.message;
        }
        if (stacktrace.name) {
            data.name = stacktrace.name;
        }
        var client = getCurrentHub().getClient();
        var maxValueLength = (client && client.getOptions().maxValueLength) || 250;
        var fallbackValue = stacktrace.original
            ? truncate(JSON.stringify(normalize(stacktrace.original)), maxValueLength)
            : '';
        var fallbackType = stacktrace.mechanism === 'onunhandledrejection' ? 'UnhandledRejection' : 'Error';
        // This makes sure we have type/value in every exception
        addExceptionTypeValue(event, fallbackValue, fallbackType, {
            data: data,
            handled: false,
            type: stacktrace.mechanism,
        });
        return event;
    };
    /**
     * This function creates an Event from an TraceKitStackTrace that has part of it missing.
     *
     * @param stacktrace TraceKitStackTrace to be converted to an Event.
     */
    GlobalHandlers.prototype._eventFromIncompleteRejection = function (stacktrace, error) {
        var event = {
            level: Severity.Error,
        };
        if (isPrimitive(error)) {
            event.exception = {
                values: [
                    {
                        type: 'UnhandledRejection',
                        value: "Non-Error promise rejection captured with value: " + error,
                    },
                ],
            };
        }
        else {
            event.exception = {
                values: [
                    {
                        type: 'UnhandledRejection',
                        value: "Non-Error promise rejection captured with keys: " + keysToEventMessage(Object.keys(error).sort()),
                    },
                ],
            };
            event.extra = {
                __serialized__: normalizeToSize(error),
            };
        }
        if (event.exception.values && event.exception.values[0]) {
            event.exception.values[0].mechanism = {
                data: tslib_1.__assign({ mode: stacktrace.mode }, (stacktrace.incomplete && { incomplete: stacktrace.incomplete }), (stacktrace.message && { message: stacktrace.message }), (stacktrace.name && { name: stacktrace.name })),
                handled: false,
                type: stacktrace.mechanism,
            };
        }
        return event;
    };
    /**
     * @inheritDoc
     */
    GlobalHandlers.id = 'GlobalHandlers';
    return GlobalHandlers;
}());
export { GlobalHandlers };
//# sourceMappingURL=globalhandlers.js.map