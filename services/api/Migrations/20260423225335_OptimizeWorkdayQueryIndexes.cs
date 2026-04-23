using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class OptimizeWorkdayQueryIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Workdays_UserId_Status_CompletedAt",
                table: "Workdays",
                columns: new[] { "UserId", "Status", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Workdays_UserId_Status_CreatedAt",
                table: "Workdays",
                columns: new[] { "UserId", "Status", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Workdays_UserId_Status_CompletedAt",
                table: "Workdays");

            migrationBuilder.DropIndex(
                name: "IX_Workdays_UserId_Status_CreatedAt",
                table: "Workdays");
        }
    }
}
