// method 2
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((err) => next(err))
    }
}

export default asyncHandler

// method 1
// const asyncHandler = (fn) => async (req, res, next) => {
//     // higher order function
//     try {
//         await fn(req, res, next)
//     } catch (err) {
//         res.status(err.code || 500).json({ success: false, message: err.message })
//     }
// }