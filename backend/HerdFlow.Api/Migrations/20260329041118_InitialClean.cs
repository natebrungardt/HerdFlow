using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialClean : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UserId",
                table: "ActivityLogEntries",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Workdays_UserId",
                table: "Workdays",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Workdays_UserId",
                table: "Workdays");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "ActivityLogEntries");
        }
    }
}
