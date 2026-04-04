using HerdFlow.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HerdFlow.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260401120000_EnableSupabaseRls")]
    public class EnableSupabaseRls : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE public."__EFMigrationsHistory" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public."ActivityLogEntries" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public."Notes" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public."Cows" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public."WorkdayCows" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public."Workdays" ENABLE ROW LEVEL SECURITY;
                ALTER TABLE public."WorkdayNotes" ENABLE ROW LEVEL SECURITY;
                """);

            CreateDirectUserPolicies(migrationBuilder, "ActivityLogEntries");
            CreateDirectUserPolicies(migrationBuilder, "Notes");
            CreateDirectUserPolicies(migrationBuilder, "Cows");
            CreateDirectUserPolicies(migrationBuilder, "Workdays");
            CreateDirectUserPolicies(migrationBuilder, "WorkdayNotes");

            migrationBuilder.Sql("""
                CREATE POLICY "WorkdayCows select own"
                ON public."WorkdayCows"
                FOR SELECT
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1
                        FROM public."Workdays" w
                        WHERE w."Id" = "WorkdayId"
                          AND w."UserId" = (SELECT auth.uid())::text
                    )
                );

                CREATE POLICY "WorkdayCows insert own"
                ON public."WorkdayCows"
                FOR INSERT
                TO authenticated
                WITH CHECK (
                    EXISTS (
                        SELECT 1
                        FROM public."Workdays" w
                        WHERE w."Id" = "WorkdayId"
                          AND w."UserId" = (SELECT auth.uid())::text
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public."Cows" c
                        WHERE c."Id" = "CowId"
                          AND c."UserId" = (SELECT auth.uid())::text
                    )
                );

                CREATE POLICY "WorkdayCows update own"
                ON public."WorkdayCows"
                FOR UPDATE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1
                        FROM public."Workdays" w
                        WHERE w."Id" = "WorkdayId"
                          AND w."UserId" = (SELECT auth.uid())::text
                    )
                )
                WITH CHECK (
                    EXISTS (
                        SELECT 1
                        FROM public."Workdays" w
                        WHERE w."Id" = "WorkdayId"
                          AND w."UserId" = (SELECT auth.uid())::text
                    )
                    AND EXISTS (
                        SELECT 1
                        FROM public."Cows" c
                        WHERE c."Id" = "CowId"
                          AND c."UserId" = (SELECT auth.uid())::text
                    )
                );

                CREATE POLICY "WorkdayCows delete own"
                ON public."WorkdayCows"
                FOR DELETE
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1
                        FROM public."Workdays" w
                        WHERE w."Id" = "WorkdayId"
                          AND w."UserId" = (SELECT auth.uid())::text
                    )
                );
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP POLICY IF EXISTS "WorkdayCows delete own" ON public."WorkdayCows";
                DROP POLICY IF EXISTS "WorkdayCows update own" ON public."WorkdayCows";
                DROP POLICY IF EXISTS "WorkdayCows insert own" ON public."WorkdayCows";
                DROP POLICY IF EXISTS "WorkdayCows select own" ON public."WorkdayCows";
                """);

            DropDirectUserPolicies(migrationBuilder, "ActivityLogEntries");
            DropDirectUserPolicies(migrationBuilder, "Notes");
            DropDirectUserPolicies(migrationBuilder, "Cows");
            DropDirectUserPolicies(migrationBuilder, "Workdays");
            DropDirectUserPolicies(migrationBuilder, "WorkdayNotes");

            migrationBuilder.Sql("""
                ALTER TABLE public."__EFMigrationsHistory" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public."ActivityLogEntries" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public."Notes" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public."Cows" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public."WorkdayCows" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public."Workdays" DISABLE ROW LEVEL SECURITY;
                ALTER TABLE public."WorkdayNotes" DISABLE ROW LEVEL SECURITY;
                """);
        }

        private static void CreateDirectUserPolicies(MigrationBuilder migrationBuilder, string tableName)
        {
            migrationBuilder.Sql($"""
                CREATE POLICY "{tableName} select own"
                ON public."{tableName}"
                FOR SELECT
                TO authenticated
                USING ("UserId" = (SELECT auth.uid())::text);

                CREATE POLICY "{tableName} insert own"
                ON public."{tableName}"
                FOR INSERT
                TO authenticated
                WITH CHECK ("UserId" = (SELECT auth.uid())::text);

                CREATE POLICY "{tableName} update own"
                ON public."{tableName}"
                FOR UPDATE
                TO authenticated
                USING ("UserId" = (SELECT auth.uid())::text)
                WITH CHECK ("UserId" = (SELECT auth.uid())::text);

                CREATE POLICY "{tableName} delete own"
                ON public."{tableName}"
                FOR DELETE
                TO authenticated
                USING ("UserId" = (SELECT auth.uid())::text);
                """);
        }

        private static void DropDirectUserPolicies(MigrationBuilder migrationBuilder, string tableName)
        {
            migrationBuilder.Sql($"""
                DROP POLICY IF EXISTS "{tableName} delete own" ON public."{tableName}";
                DROP POLICY IF EXISTS "{tableName} update own" ON public."{tableName}";
                DROP POLICY IF EXISTS "{tableName} insert own" ON public."{tableName}";
                DROP POLICY IF EXISTS "{tableName} select own" ON public."{tableName}";
                """);
        }
    }
}
