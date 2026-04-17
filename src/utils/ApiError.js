class ApiError extends Error{
    constructor(statusCode, message = "Something went wrong", errors = [], stack = ""){
        super(message)
        this.statusCode = statusCode
        this.data = null // HW Read about data field what is inside this.data field
        this.message = message
        this.success = false
        this.errors = errors

        if(stack) {
            this.stack = stack
        }else{
            Error.captureStackTrace(this, this.constructor) // HW Also Read about this captureStackTrace in details
        }
    }
}

export { ApiError }