using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixActivityLogWorkdayFk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogEntries_Workdays_WorkdayId",
                table: "ActivityLogEntries");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogEntries_Workdays_WorkdayId",
                table: "ActivityLogEntries",
                column: "WorkdayId",
                principalTable: "Workdays",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogEntries_Workdays_WorkdayId",
                table: "ActivityLogEntries");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogEntries_Workdays_WorkdayId",
                table: "ActivityLogEntries",
                column: "WorkdayId",
                principalTable: "Workdays",
                principalColumn: "Id");
        }
    }
}
