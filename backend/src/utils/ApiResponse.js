export class ApiResponse{
    constructor(statusCode, data = null, message = "success"){
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        this.data = data
    }
}