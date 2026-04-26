namespace HerdFlow.Api.DTOs;

public class ImportResultDto
{
    public int ImportedCount { get; set; }
    public List<ImportSkippedRowDto> SkippedRows { get; set; } = new();
    public List<ImportWarningRowDto> WarningRows { get; set; } = new();
}

public class ImportSkippedRowDto
{
    public int RowNumber { get; set; }
    public string Reason { get; set; } = null!;
    public string? TagNumber { get; set; }
}

public class ImportWarningRowDto
{
    public int RowNumber { get; set; }
    public string Field { get; set; } = null!;
    public string Message { get; set; } = null!;
}
