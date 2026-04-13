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

            var from = new EmailAddress("natebrungardt15@gmail.com", "HerdFlow");
            var to = new EmailAddress("natebrungardt15@gmail.com");

            var subject = $"[{dto.AppName ?? "HerdFlow"}] New Feedback";

            var content = $@"
Name: {dto.Name}
Email: {dto.Email}
Company: {dto.Company}

Message:
{dto.Message}
";

            var msg = MailHelper.CreateSingleEmail(from, to, subject, content, content);

            await client.SendEmailAsync(msg);

            return Ok();
        }
    }

    public class FeedbackDto
    {
        public string AppName { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Company { get; set; }
        public string Message { get; set; }
    }
}
