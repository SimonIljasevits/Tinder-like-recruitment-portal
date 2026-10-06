using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_jobby.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalUrlToJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "external_url",
                table: "jobs",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "external_url",
                table: "jobs");
        }
    }
}
