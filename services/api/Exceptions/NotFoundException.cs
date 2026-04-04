namespace HerdFlow.Api.Exceptions;

public sealed class NotFoundException : ApiException
{
    public NotFoundException(string message)
        : base(message, StatusCodes.Status404NotFound, "Not Found")
    {
    }
}
