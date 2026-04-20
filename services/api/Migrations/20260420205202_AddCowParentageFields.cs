using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCowParentageFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BirthWeight",
                table: "Cows",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Color",
                table: "Cows",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DamId",
                table: "Cows",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DamName",
                table: "Cows",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EaseOfBirth",
                table: "Cows",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Cows",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "SireId",
                table: "Cows",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SireName",
                table: "Cows",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Cows_DamId",
                table: "Cows",
                column: "DamId");

            migrationBuilder.CreateIndex(
                name: "IX_Cows_SireId",
                table: "Cows",
                column: "SireId");

            migrationBuilder.AddForeignKey(
                name: "FK_Cows_Cows_DamId",
                table: "Cows",
                column: "DamId",
                principalTable: "Cows",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Cows_Cows_SireId",
                table: "Cows",
                column: "SireId",
                principalTable: "Cows",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Cows_Cows_DamId",
                table: "Cows");

            migrationBuilder.DropForeignKey(
                name: "FK_Cows_Cows_SireId",
                table: "Cows");

            migrationBuilder.DropIndex(
                name: "IX_Cows_DamId",
                table: "Cows");

            migrationBuilder.DropIndex(
                name: "IX_Cows_SireId",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "BirthWeight",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "Color",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "DamId",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "DamName",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "EaseOfBirth",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "SireId",
                table: "Cows");

            migrationBuilder.DropColumn(
                name: "SireName",
                table: "Cows");
        }
    }
}
