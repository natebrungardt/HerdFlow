using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Models.Enums;

namespace HerdFlow.Api.Tests.TestInfrastructure;

internal static class TestData
{
    public static CreateCowDto CreateCowDto(
        string tagNumber = "A-100",
        LivestockGroupType livestockGroup = LivestockGroupType.Breeding,
        string ownerName = "Dev Ranch",
        string? pregnancyStatus = "Open")
    {
        return new CreateCowDto
        {
            TagNumber = tagNumber,
            OwnerName = ownerName,
            LivestockGroup = livestockGroup,
            Breed = "Angus",
            Sex = "Female",
            HealthStatus = HealthStatusType.Healthy,
            HeatStatus = HeatStatusType.WatchHeat,
            PregnancyStatus = pregnancyStatus,
            HasCalf = false,
            DateOfBirth = new DateOnly(2022, 3, 1),
            PurchaseDate = new DateOnly(2023, 5, 1),
            PurchasePrice = 1800m,
        };
    }

    public static Cow Cow(
        string userId,
        string tagNumber = "A-100",
        bool isRemoved = false)
    {
        return new Cow
        {
            UserId = userId,
            TagNumber = tagNumber,
            OwnerName = "Dev Ranch",
            LivestockGroup = LivestockGroupType.Breeding,
            Breed = "Angus",
            Sex = "Female",
            HealthStatus = HealthStatusType.Healthy,
            HeatStatus = HeatStatusType.WatchHeat,
            PregnancyStatus = "Open",
            IsRemoved = isRemoved,
        };
    }

    public static Note Note(
        string userId,
        Guid cowId,
        string content,
        DateTime? createdAt = null)
    {
        var timestamp = createdAt ?? DateTime.UtcNow;

        return new Note
        {
            UserId = userId,
            CowId = cowId,
            Content = content,
            CreatedAt = timestamp,
            UpdatedAt = timestamp,
        };
    }

    public static CreateWorkdayDto CreateWorkdayDto(
        string title = "Morning Checks",
        DateOnly? date = null,
        List<Guid>? cowIds = null)
    {
        return new CreateWorkdayDto
        {
            Title = title,
            Date = date,
            Summary = "Checked feed and water",
            CowIds = cowIds ?? new List<Guid>()
        };
    }
}
