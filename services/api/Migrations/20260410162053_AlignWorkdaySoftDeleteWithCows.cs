using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AlignWorkdaySoftDeleteWithCows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "IsArchived",
                table: "Workdays",
                newName: "IsRemoved");

            migrationBuilder.AddColumn<DateTime>(
                name: "RemovedAt",
                table: "Workdays",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RemovedAt",
                table: "Workdays");

            migrationBuilder.RenameColumn(
                name: "IsRemoved",
                table: "Workdays",
                newName: "IsArchived");
        }
    }
}
