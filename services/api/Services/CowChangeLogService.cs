using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;
using HerdFlow.Api.Models.Enums;

namespace HerdFlow.Api.Services;

public class CowChangeLogService
{
    public List<string> BuildUpdateMessages(Cow cow, UpdateCowDto dto)
    {
        var changes = new List<string>();

        if (cow.HealthStatus != dto.HealthStatus)
        {
            var cowLabel = !string.IsNullOrEmpty(cow.TagNumber) ? $"Tag {cow.TagNumber}" : "Cow";
            var statusLabel = dto.HealthStatus == HealthStatusType.Healthy ? "Healthy" : "Needs Treatment";
            changes.Add($"{cowLabel} was marked as {statusLabel}");
        }

        if (cow.LivestockGroup != dto.LivestockGroup)
        {
            var isCleared = !dto.LivestockGroup.HasValue || dto.LivestockGroup == LivestockGroupType.None;
            changes.Add(isCleared ? "Livestock group cleared" : $"Moved to {dto.LivestockGroup!.Value} group");
        }

        AddChange(changes, cow.TagNumber, dto.TagNumber, "Tag number");
        AddChange(changes, cow.OwnerName, dto.OwnerName, "Owner");
        AddChange(changes, cow.Breed, dto.Breed, "Breed");
        AddChange(changes, cow.Sex, dto.Sex, "Sex");
        AddChange(changes, cow.Name, dto.Name, "Name");
        AddChange(changes, cow.Color, dto.Color, "Color");
        AddChange(changes, cow.BirthWeight, dto.BirthWeight, "Birth weight");
        AddChange(changes, cow.EaseOfBirth, dto.EaseOfBirth, "Ease of birth");
        AddChange(changes, cow.SireId, dto.SireId, "Sire");
        AddChange(changes, cow.SireName, dto.SireName, "Sire name");
        AddChange(changes, cow.DamId, dto.DamId, "Dam");
        AddChange(changes, cow.DamName, dto.DamName, "Dam name");
        AddChange(changes, cow.PurchasePrice, dto.PurchasePrice, "Purchase price");
        AddChange(changes, cow.SalePrice, dto.SalePrice, "Sale price");
        AddChange(changes, cow.DateOfBirth, dto.DateOfBirth, "Date of birth");
        AddChange(changes, cow.PurchaseDate, dto.PurchaseDate, "Purchase date");
        AddChange(changes, cow.SaleDate, dto.SaleDate, "Sale date");
        AddChange(changes, cow.HeatStatus, dto.HeatStatus, "Heat status");
        AddChange(changes, cow.PregnancyStatus, dto.PregnancyStatus, "Pregnancy status");
        AddChange(changes, cow.HasCalf, dto.HasCalf, "Has calf");

        return changes;
    }

    private static void AddChange<T>(List<string> changes, T currentValue, T nextValue, string label)
    {
        if (EqualityComparer<T>.Default.Equals(currentValue, nextValue)) return;

        if (currentValue is null)
            changes.Add($"{label} set to {FormatValue(nextValue)}");
        else if (nextValue is null)
            changes.Add($"{label} cleared");
        else
            changes.Add($"{label} changed from {FormatValue(currentValue)} to {FormatValue(nextValue)}");
    }

    private static string FormatValue<T>(T value)
    {
        return value switch
        {
            null => "none",
            bool boolean => boolean ? "Yes" : "No",
            DateOnly date => date.ToString("MMM dd, yyyy"),
            decimal amount => amount.ToString("0.##"),
            Guid guid => guid.ToString()[..8],
            _ => value.ToString() ?? "none",
        };
    }
}
