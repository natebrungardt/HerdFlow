using HerdFlow.Api.DTOs;
using HerdFlow.Api.Models;

namespace HerdFlow.Api.Services;

public class CowChangeLogService
{
    public List<string> BuildUpdateMessages(Cow cow, CreateCowDto dto)
    {
        var changes = new List<string>();

        AddChange(changes, cow.TagNumber, dto.TagNumber, "Tag number");
        AddChange(changes, cow.OwnerName, dto.OwnerName, "Owner");
        AddChange(changes, cow.LivestockGroup, dto.LivestockGroup, "Livestock group");
        AddChange(changes, cow.HealthStatus, dto.HealthStatus, "Health status");
        AddChange(changes, cow.Breed, dto.Breed, "Breed");
        AddChange(changes, cow.Sex, dto.Sex, "Sex");
        AddChange(changes, cow.PurchasePrice, dto.PurchasePrice, "Purchase price");
        AddChange(changes, cow.SalePrice, dto.SalePrice, "Sale price");
        AddChange(changes, cow.DateOfBirth, dto.DateOfBirth, "Date of birth");
        AddChange(changes, cow.PurchaseDate, dto.PurchaseDate, "Purchase date");
        AddChange(changes, cow.SaleDate, dto.SaleDate, "Sale date");
        AddChange(changes, cow.HeatStatus, dto.HeatStatus, "Heat status");
        AddChange(changes, cow.PregnancyStatus, dto.PregnancyStatus, "Pregnancy status");
        AddChange(changes, cow.HasCalf, dto.HasCalf, "Has calf");

        if (changes.Count == 0)
        {
            changes.Add("Cow updated");
        }

        return changes;
    }

    private static void AddChange<T>(
        List<string> changes,
        T currentValue,
        T nextValue,
        string label)
    {
        if (EqualityComparer<T>.Default.Equals(currentValue, nextValue))
        {
            return;
        }

        changes.Add(
            $"{label} changed from {FormatValue(currentValue)} to {FormatValue(nextValue)}");
    }

    private static string FormatValue<T>(T value)
    {
        return value switch
        {
            null => "—",
            bool boolean => boolean ? "Yes" : "No",
            DateOnly date => date.ToString("MMM dd, yyyy"),
            decimal amount => amount.ToString("0.##"),
            _ => value.ToString() ?? "—",
        };
    }
}
