namespace HerdFlow.Api.Exceptions;

public abstract class ApiException : Exception
{
    protected ApiException(string message, int statusCode, string title)
        : base(message)
    {
        StatusCode = statusCode;
        Title = title;
    }

    public int StatusCode { get; }

    public string Title { get; }
}
