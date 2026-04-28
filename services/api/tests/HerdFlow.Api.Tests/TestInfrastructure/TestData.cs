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
        string? pregnancyStatus = "Open",
        Guid? sireId = null,
        string? sireName = null,
        Guid? damId = null,
        string? damName = null)
    {
        return new CreateCowDto
        {
            TagNumber = tagNumber,
            OwnerName = ownerName,
            LivestockGroup = livestockGroup,
            Breed = "Angus",
            Sex = "Female",
            Name = "Daisy",
            Color = "Black",
            HealthStatus = HealthStatusType.Healthy,
            HeatStatus = HeatStatusType.WatchHeat,
            PregnancyStatus = pregnancyStatus,
            DateOfBirth = new DateOnly(2022, 3, 1),
            BirthWeight = 82.5m,
            EaseOfBirth = "Easy pull",
            PurchaseDate = new DateOnly(2023, 5, 1),
            PurchasePrice = 1800m,
            SireId = sireId,
            SireName = sireName,
            DamId = damId,
            DamName = damName,
        };
    }

    public static UpdateCowDto UpdateCowDto(
        string tagNumber = "A-100",
        LivestockGroupType livestockGroup = LivestockGroupType.Breeding,
        string ownerName = "Dev Ranch",
        string? pregnancyStatus = "Open",
        Guid? sireId = null,
        string? sireName = null,
        Guid? damId = null,
        string? damName = null)
    {
        return new UpdateCowDto
        {
            TagNumber = tagNumber,
            OwnerName = ownerName,
            LivestockGroup = livestockGroup,
            Breed = "Angus",
            Sex = "Female",
            Name = "Daisy",
            Color = "Black",
            HealthStatus = HealthStatusType.Healthy,
            HeatStatus = HeatStatusType.WatchHeat,
            PregnancyStatus = pregnancyStatus,
            DateOfBirth = new DateOnly(2022, 3, 1),
            BirthWeight = 82.5m,
            EaseOfBirth = "Easy pull",
            PurchaseDate = new DateOnly(2023, 5, 1),
            PurchasePrice = 1800m,
            SireId = sireId,
            SireName = sireName,
            DamId = damId,
            DamName = damName,
        };
    }

    public static Cow Cow(
        string userId,
        string tagNumber = "A-100",
        bool isRemoved = false,
        DateTime? removedAt = null,
        DateTime? createdAt = null)
    {
        return new Cow
        {
            UserId = userId,
            TagNumber = tagNumber,
            OwnerName = "Dev Ranch",
            LivestockGroup = LivestockGroupType.Breeding,
            Breed = "Angus",
            Sex = "Female",
            Name = "Daisy",
            Color = "Black",
            HealthStatus = HealthStatusType.Healthy,
            HeatStatus = HeatStatusType.WatchHeat,
            PregnancyStatus = "Open",
            BirthWeight = 82.5m,
            EaseOfBirth = "Easy pull",
            CreatedAt = createdAt ?? DateTime.UtcNow,
            IsRemoved = isRemoved,
            RemovedAt = removedAt,
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
        DateOnly? date = null)
    {
        return new CreateWorkdayDto
        {
            Title = title,
            Date = date,
            Summary = "Checked feed and water"
        };
    }
}
