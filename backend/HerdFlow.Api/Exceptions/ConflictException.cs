namespace HerdFlow.Api.Exceptions;

public sealed class ConflictException : ApiException
{
    public ConflictException(string message)
        : base(message, StatusCodes.Status409Conflict, "Conflict")
    {
    }
}
