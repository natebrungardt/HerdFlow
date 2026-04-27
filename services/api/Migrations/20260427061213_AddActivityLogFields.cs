using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLogFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogEntries_Cows_CowId",
                table: "ActivityLogEntries");

            migrationBuilder.AlterColumn<Guid>(
                name: "CowId",
                table: "ActivityLogEntries",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "EventType",
                table: "ActivityLogEntries",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "WorkdayId",
                table: "ActivityLogEntries",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogEntries_WorkdayId",
                table: "ActivityLogEntries",
                column: "WorkdayId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogEntries_Cows_CowId",
                table: "ActivityLogEntries",
                column: "CowId",
                principalTable: "Cows",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogEntries_Workdays_WorkdayId",
                table: "ActivityLogEntries",
                column: "WorkdayId",
                principalTable: "Workdays",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogEntries_Cows_CowId",
                table: "ActivityLogEntries");

            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogEntries_Workdays_WorkdayId",
                table: "ActivityLogEntries");

            migrationBuilder.DropIndex(
                name: "IX_ActivityLogEntries_WorkdayId",
                table: "ActivityLogEntries");

            migrationBuilder.DropColumn(
                name: "EventType",
                table: "ActivityLogEntries");

            migrationBuilder.DropColumn(
                name: "WorkdayId",
                table: "ActivityLogEntries");

            migrationBuilder.AlterColumn<Guid>(
                name: "CowId",
                table: "ActivityLogEntries",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogEntries_Cows_CowId",
                table: "ActivityLogEntries",
                column: "CowId",
                principalTable: "Cows",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
