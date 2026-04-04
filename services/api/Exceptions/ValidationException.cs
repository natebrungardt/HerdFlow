namespace HerdFlow.Api.Exceptions;

public sealed class ValidationException : ApiException
{
    public ValidationException(string message)
        : base(message, StatusCodes.Status400BadRequest, "Validation Failed")
    {
    }
}
