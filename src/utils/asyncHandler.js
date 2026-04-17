// HW Read about Request and Response in details and source to follow go to Express.js HomePage and read.
const asyncHandler = (requestHandler) => {
    (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }


// const asyncHandler = () => {}
// const asyncHandler = (fn) => { (fn) => {}}
// const asyncHandler = (fn) => async () => {}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }