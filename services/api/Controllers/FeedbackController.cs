using Microsoft.AspNetCore.Mvc;
using SendGrid;
using SendGrid.Helpers.Mail;


namespace HerdFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FeedbackController : ControllerBase
    {
        [HttpPost]
        public async Task<IActionResult> SendFeedback([FromBody] FeedbackDto dto)
        {
            var apiKey = Environment.GetEnvironmentVariable("SENDGRID_API_KEY");
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, "SendGrid API key not found");

            var client = new SendGridClient(apiKey);

            var from = new EmailAddress("no-reply@herdflow.app", "HerdFlow");
            var to = new EmailAddress("natebrungardt15@gmail.com");

            var subject = $"[{dto.AppName}] New Feedback";

            var companyLine = string.IsNullOrWhiteSpace(dto.Company) ? "" : $"Company: {dto.Company}\n";

            var content = $@"
Name: {dto.Name}
Email: {dto.Email}
{companyLine}Message:
{dto.Message}
";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, content, content);
            msg.SetReplyTo(new EmailAddress(dto.Email, dto.Name));
            var response = await client.SendEmailAsync(msg);

            Console.WriteLine($"Status Code: {response.StatusCode}");

            var body = await response.Body.ReadAsStringAsync();
            Console.WriteLine($"Response Body: {body}");

            if (!response.IsSuccessStatusCode)
            {
                return StatusCode((int)response.StatusCode, "Failed to send email");
            }

            return Ok();
        }
    }

    public class FeedbackDto
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string AppName { get; set; } = null!;

        [System.ComponentModel.DataAnnotations.Required]
        public string Name { get; set; } = null!;

        [System.ComponentModel.DataAnnotations.Required]
        [System.ComponentModel.DataAnnotations.EmailAddress]
        public string Email { get; set; } = null!;

        public string? Company { get; set; }

        [System.ComponentModel.DataAnnotations.Required]
        public string Message { get; set; } = null!;
    }
}
