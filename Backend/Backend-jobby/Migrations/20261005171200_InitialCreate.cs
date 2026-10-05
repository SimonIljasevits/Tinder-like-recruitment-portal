using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend_jobby.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "employer_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    company_name = table.Column<string>(type: "text", nullable: true),
                    company_initials = table.Column<string>(type: "text", nullable: true),
                    phone = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_employer_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_employer_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jobseeker_profiles",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    full_name = table.Column<string>(type: "text", nullable: false),
                    phone = table.Column<string>(type: "text", nullable: true),
                    city = table.Column<string>(type: "text", nullable: true),
                    min_hourly_pay = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    summary = table.Column<string>(type: "text", nullable: true),
                    availability = table.Column<string>(type: "text", nullable: true),
                    conditions = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobseeker_profiles", x => x.id);
                    table.ForeignKey(
                        name: "fk_jobseeker_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    employer_profile_id = table.Column<Guid>(type: "uuid", nullable: true),
                    company_name = table.Column<string>(type: "text", nullable: false),
                    company_initials = table.Column<string>(type: "text", nullable: true),
                    title = table.Column<string>(type: "text", nullable: false),
                    hourly_pay = table.Column<decimal>(type: "numeric(6,2)", precision: 6, scale: 2, nullable: false),
                    primary_skill = table.Column<string>(type: "text", nullable: false),
                    location = table.Column<string>(type: "text", nullable: false),
                    distance_km = table.Column<decimal>(type: "numeric(5,1)", precision: 5, scale: 1, nullable: false),
                    working_hours = table.Column<string>(type: "text", nullable: true),
                    start_date_text = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: false),
                    first_message = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobs", x => x.id);
                    table.ForeignKey(
                        name: "fk_jobs_employer_profiles_employer_profile_id",
                        column: x => x.employer_profile_id,
                        principalTable: "employer_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "jobseeker_accommodations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    accommodation_code = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobseeker_accommodations", x => x.id);
                    table.ForeignKey(
                        name: "fk_jobseeker_accommodations_jobseeker_profiles_jobseeker_profi",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jobseeker_experiences",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role_title = table.Column<string>(type: "text", nullable: false),
                    organization = table.Column<string>(type: "text", nullable: false),
                    period = table.Column<string>(type: "text", nullable: false),
                    description = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobseeker_experiences", x => x.id);
                    table.ForeignKey(
                        name: "fk_jobseeker_experiences_jobseeker_profiles_jobseeker_profile_",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jobseeker_schedules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    schedule_code = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobseeker_schedules", x => x.id);
                    table.ForeignKey(
                        name: "fk_jobseeker_schedules_jobseeker_profiles_jobseeker_profile_id",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "jobseeker_skills",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    skill_code = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_jobseeker_skills", x => x.id);
                    table.ForeignKey(
                        name: "fk_jobseeker_skills_jobseeker_profiles_jobseeker_profile_id",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "applications",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    is_tailored_cv = table.Column<bool>(type: "boolean", nullable: false),
                    cv_snapshot_json = table.Column<string>(type: "text", nullable: true),
                    applied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_applications", x => x.id);
                    table.ForeignKey(
                        name: "fk_applications_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_applications_jobseeker_profiles_jobseeker_profile_id",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ignored_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    passed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_ignored_jobs", x => x.id);
                    table.ForeignKey(
                        name: "fk_ignored_jobs_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_ignored_jobs_jobseeker_profiles_jobseeker_profile_id",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_accommodations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    accommodation_code = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_accommodations", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_accommodations_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_offers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    offer_text = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_offers", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_offers_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_requirements",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    requirement_text = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_requirements", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_requirements_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "job_shifts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    shift_code = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_job_shifts", x => x.id);
                    table.ForeignKey(
                        name: "fk_job_shifts_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "saved_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    jobseeker_profile_id = table.Column<Guid>(type: "uuid", nullable: false),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    saved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_saved_jobs", x => x.id);
                    table.ForeignKey(
                        name: "fk_saved_jobs_jobs_job_id",
                        column: x => x.job_id,
                        principalTable: "jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_saved_jobs_jobseeker_profiles_jobseeker_profile_id",
                        column: x => x.jobseeker_profile_id,
                        principalTable: "jobseeker_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    application_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_conversations", x => x.id);
                    table.ForeignKey(
                        name: "fk_conversations_applications_application_id",
                        column: x => x.application_id,
                        principalTable: "applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    is_system_message = table.Column<bool>(type: "boolean", nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_read = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_messages", x => x.id);
                    table.ForeignKey(
                        name: "fk_messages_conversations_conversation_id",
                        column: x => x.conversation_id,
                        principalTable: "conversations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_messages_users_sender_user_id",
                        column: x => x.sender_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "ix_applications_job_id",
                table: "applications",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_applications_jobseeker_profile_id_job_id",
                table: "applications",
                columns: new[] { "jobseeker_profile_id", "job_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_conversations_application_id",
                table: "conversations",
                column: "application_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_employer_profiles_user_id",
                table: "employer_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_ignored_jobs_job_id",
                table: "ignored_jobs",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_ignored_jobs_jobseeker_profile_id_job_id",
                table: "ignored_jobs",
                columns: new[] { "jobseeker_profile_id", "job_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_job_accommodations_job_id",
                table: "job_accommodations",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_offers_job_id",
                table: "job_offers",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_requirements_job_id",
                table: "job_requirements",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_job_shifts_job_id",
                table: "job_shifts",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_jobs_employer_profile_id",
                table: "jobs",
                column: "employer_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_jobseeker_accommodations_jobseeker_profile_id",
                table: "jobseeker_accommodations",
                column: "jobseeker_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_jobseeker_experiences_jobseeker_profile_id",
                table: "jobseeker_experiences",
                column: "jobseeker_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_jobseeker_profiles_user_id",
                table: "jobseeker_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_jobseeker_schedules_jobseeker_profile_id",
                table: "jobseeker_schedules",
                column: "jobseeker_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_jobseeker_skills_jobseeker_profile_id",
                table: "jobseeker_skills",
                column: "jobseeker_profile_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_conversation_id",
                table: "messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "ix_messages_sender_user_id",
                table: "messages",
                column: "sender_user_id");

            migrationBuilder.CreateIndex(
                name: "ix_saved_jobs_job_id",
                table: "saved_jobs",
                column: "job_id");

            migrationBuilder.CreateIndex(
                name: "ix_saved_jobs_jobseeker_profile_id_job_id",
                table: "saved_jobs",
                columns: new[] { "jobseeker_profile_id", "job_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ignored_jobs");

            migrationBuilder.DropTable(
                name: "job_accommodations");

            migrationBuilder.DropTable(
                name: "job_offers");

            migrationBuilder.DropTable(
                name: "job_requirements");

            migrationBuilder.DropTable(
                name: "job_shifts");

            migrationBuilder.DropTable(
                name: "jobseeker_accommodations");

            migrationBuilder.DropTable(
                name: "jobseeker_experiences");

            migrationBuilder.DropTable(
                name: "jobseeker_schedules");

            migrationBuilder.DropTable(
                name: "jobseeker_skills");

            migrationBuilder.DropTable(
                name: "messages");

            migrationBuilder.DropTable(
                name: "saved_jobs");

            migrationBuilder.DropTable(
                name: "conversations");

            migrationBuilder.DropTable(
                name: "applications");

            migrationBuilder.DropTable(
                name: "jobs");

            migrationBuilder.DropTable(
                name: "jobseeker_profiles");

            migrationBuilder.DropTable(
                name: "employer_profiles");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
