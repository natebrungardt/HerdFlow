using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveWorkdaySoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsRemoved",
                table: "Workdays");

            migrationBuilder.DropColumn(
                name: "RemovedAt",
                table: "Workdays");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsRemoved",
                table: "Workdays",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RemovedAt",
                table: "Workdays",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
