using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkdayGrid : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Workdays",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "WorkdayActions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkdayId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkdayActions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkdayActions_Workdays_WorkdayId",
                        column: x => x.WorkdayId,
                        principalTable: "Workdays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WorkdayEntries",
                columns: table => new
                {
                    WorkdayId = table.Column<Guid>(type: "uuid", nullable: false),
                    CowId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActionId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkdayEntries", x => new { x.WorkdayId, x.CowId, x.ActionId });
                    table.ForeignKey(
                        name: "FK_WorkdayEntries_Cows_CowId",
                        column: x => x.CowId,
                        principalTable: "Cows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkdayEntries_WorkdayActions_ActionId",
                        column: x => x.ActionId,
                        principalTable: "WorkdayActions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkdayEntries_Workdays_WorkdayId",
                        column: x => x.WorkdayId,
                        principalTable: "Workdays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkdayActions_WorkdayId",
                table: "WorkdayActions",
                column: "WorkdayId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkdayEntries_ActionId",
                table: "WorkdayEntries",
                column: "ActionId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkdayEntries_CowId",
                table: "WorkdayEntries",
                column: "CowId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkdayEntries");

            migrationBuilder.DropTable(
                name: "WorkdayActions");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Workdays");
        }
    }
}
