using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_jobby.Migrations
{
    /// <inheritdoc />
    public partial class AddSourceToJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "source",
                table: "jobs",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "source",
                table: "jobs");
        }
    }
}
