import { useEffect, useRef, useState } from "react";
import {
  downloadImportTemplate,
  importCowsCsv,
  type ImportResult,
} from "../../services/cowService";
import "../../styles/ImportModal.css";

type ImportModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Step = "template" | "upload" | "results";

const TEMPLATE_FIELDS: { label: string; required?: true }[] = [
  { label: "Tag Number", required: true },
  { label: "Owner Name" },
  { label: "Livestock Group" },
  { label: "Sex" },
  { label: "Breed" },
  { label: "Name" },
  { label: "Color" },
  { label: "Date of Birth" },
  { label: "Birth Weight" },
  { label: "Ease of Birth" },
  { label: "Sire" },
  { label: "Dam" },
  { label: "Health Status" },
  { label: "Heat Status" },
  { label: "Pregnancy Status" },
  { label: "Has Calf" },
  { label: "Purchase Price" },
  { label: "Sale Price" },
  { label: "Purchase Date" },
  { label: "Sale Date" },
  { label: "Notes" },
];

const STEP_ORDER: Record<Step, number> = { template: 0, upload: 1, results: 2 };

function formatFileSize(bytes: number): string {
  const kb = Math.round(bytes / 1024);
  return kb < 1 ? "< 1 KB" : `${kb} KB`;
}

export default function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [step, setStep] = useState<Step>("template");
  const [file, setFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep("template");
    setFile(null);
    setRowCount(null);
    setIsDragOver(false);
    setIsDownloading(false);
    setIsDownloaded(false);
    setIsImporting(false);
    setUploadError("");
    setResult(null);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleDownloadTemplate() {
    setIsDownloading(true);
    try {
      await downloadImportTemplate();
      setIsDownloaded(true);
    } finally {
      setIsDownloading(false);
    }
  }

  function detectRowCount(f: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) ?? "";
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      setRowCount(Math.max(0, lines.length - 1));
    };
    reader.readAsText(f);
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setUploadError("");
    if (selected) detectRowCount(selected);
    else setRowCount(null);
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);
    const dropped = event.dataTransfer.files?.[0] ?? null;
    if (dropped && !dropped.name.endsWith(".csv")) {
      setUploadError("Only .csv files are supported.");
      return;
    }
    setFile(dropped);
    setUploadError("");
    if (dropped) detectRowCount(dropped);
  }

  function removeFile() {
    setFile(null);
    setRowCount(null);
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleImport() {
    if (!file) {
      setUploadError("Please select a CSV file to upload.");
      return;
    }
    if (!file.name.endsWith(".csv")) {
      setUploadError("Only .csv files are supported.");
      return;
    }
    setIsImporting(true);
    setUploadError("");
    try {
      const importResult = await importCowsCsv(file);
      setResult(importResult);
      setStep("results");
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Import failed. Please try again.",
      );
    } finally {
      setIsImporting(false);
    }
  }

  function tabClass(tabStep: Step) {
    if (step === tabStep) return "importStepTab active";
    if (STEP_ORDER[step] > STEP_ORDER[tabStep]) return "importStepTab done";
    return "importStepTab";
  }

  const showBack = step === "upload";

  let primaryLabel = "Next →";
  let primaryDisabled = false;
  let primaryAction: () => void = () => setStep("upload");

  if (step === "upload") {
    primaryLabel = isImporting ? "Importing…" : "Import →";
    primaryDisabled = !file || isImporting;
    primaryAction = handleImport;
  } else if (step === "results") {
    primaryLabel = "Done";
    primaryAction = onClose;
  }

  let footerHint = "";
  if (step === "template") {
    footerHint = "Fill in the template, then come back to upload it";
  } else if (step === "upload") {
    footerHint = file
      ? `${rowCount != null ? rowCount : "…"} rows ready to import`
      : "Upload your filled template to continue";
  }

  return (
    <div
      aria-modal="true"
      className="modalOverlay"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="modalCard importModalCard"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="importHeader">
          <div>
            <h3 className="importHeaderTitle">Import Herd Data</h3>
            <p className="importHeaderSub">Add multiple cows at once using our template</p>
          </div>
          <button
            aria-label="Close"
            className="importCloseBtn"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Step tabs */}
        <div className="importStepTabs">
          <div className={tabClass("template")}>
            <div className="importStepDot">
              {STEP_ORDER[step] > 0 ? "✓" : "1"}
            </div>
            Download Template
          </div>
          <div className={tabClass("upload")}>
            <div className="importStepDot">
              {STEP_ORDER[step] > 1 ? "✓" : "2"}
            </div>
            Upload Filled File
          </div>
          <div className={tabClass("results")}>
            <div className="importStepDot">3</div>
            Done
          </div>
        </div>

        {/* Step content */}
        <div className="importStepContent">

          {/* ── Step 1 ── */}
          {step === "template" && (
            <>
              <p className="importStepLabel">Step 1 — Get the template</p>

              <div className="importTemplateCard">
                <div className="importTemplateIcon" aria-hidden="true">📋</div>
                <div className="importTemplateInfo">
                  <h4>HerdFlow Import Template</h4>
                  <p>A blank spreadsheet with all the fields HerdFlow tracks, ready for you to fill in.</p>
                </div>
                <button
                  className={`importDownloadBtn${isDownloaded ? " downloaded" : ""}`}
                  disabled={isDownloading || isDownloaded}
                  onClick={handleDownloadTemplate}
                  type="button"
                >
                  {isDownloading ? "Downloading…" : isDownloaded ? "✓ Downloaded" : "↓ Download"}
                </button>
              </div>

              <div className="importColumnsPreview">
                <h4>Fields included in the template</h4>
                <div className="importColumnsGrid">
                  {TEMPLATE_FIELDS.map((f) => (
                    <div
                      key={f.label}
                      className={`importColItem${f.required ? " required" : ""}`}
                    >
                      {f.label}{f.required ? " *" : ""}
                    </div>
                  ))}
                </div>
              </div>

              <p className="importRequiredNote">
                * Tag Number is the only required field. All other fields are optional.
              </p>
            </>
          )}

          {/* ── Step 2 ── */}
          {step === "upload" && (
            <>
              <p className="importStepLabel">Step 2 — Fill it in and upload</p>

              <div className="importInstructions">
                <p>
                  Open the template in Excel or Google Sheets, fill in your cattle records, then upload it below.{" "}
                  <strong>Don&apos;t rename or remove any column headers</strong> — HerdFlow uses them to map your data correctly.
                </p>
              </div>

              <input
                ref={fileInputRef}
                accept=".csv"
                id="import-file-input"
                onChange={handleFileChange}
                style={{ display: "none" }}
                type="file"
              />

              {!file ? (
                <div
                  className={`importUploadZone${isDragOver ? " dragover" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <div className="importUploadIcon" aria-hidden="true">📂</div>
                  <h4>Drop your file here</h4>
                  <p>Drag and drop or click to browse</p>
                  <p className="importFormatNote">Accepts .csv</p>
                  <button
                    className="importChooseBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    type="button"
                  >
                    Choose File
                  </button>
                </div>
              ) : (
                <div className="importFileChosen">
                  <div className="importFileChosenIcon" aria-hidden="true">📄</div>
                  <div className="importFileChosenInfo">
                    <div className="importFileName">{file.name}</div>
                    <div className="importFileMeta">
                      {rowCount != null ? `${rowCount} rows detected` : "Reading…"} &middot; {formatFileSize(file.size)}
                    </div>
                  </div>
                  <button
                    aria-label="Remove file"
                    className="importFileRemove"
                    onClick={removeFile}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              )}

              {uploadError && (
                <div className="importError">{uploadError}</div>
              )}
            </>
          )}

          {/* ── Step 3 ── */}
          {step === "results" && result && (
            <>
              <div className="importResultSuccess">
                <div className="importResultIcon" aria-hidden="true">🐄</div>
                <h3>Import Complete</h3>
                <p>Your cattle records have been added to HerdFlow.</p>
              </div>

              <div className="importResultStats">
                <div className="importResultStat">
                  <div className="importStatN">{result.importedCount}</div>
                  <div className="importStatL">Cows Imported</div>
                </div>
                <div className="importResultStat warn">
                  <div className="importStatN">{result.warningRows.length}</div>
                  <div className="importStatL">Warnings</div>
                </div>
                <div className="importResultStat err">
                  <div className="importStatN">{result.skippedRows.length}</div>
                  <div className="importStatL">Errors</div>
                </div>
              </div>

              {result.warningRows.length > 0 && (
                <div className="importDetailList importDetailListWarn">
                  <h4>&#9888; Warnings — imported with blanks</h4>
                  {result.warningRows.map((row, i) => (
                    <div key={`warn-${row.rowNumber}-${i}`} className="importDetailItem">
                      <span className="importDetailRow importDetailRowWarn">Row {row.rowNumber}</span>
                      <span>&ldquo;{row.field}&rdquo; — {row.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.skippedRows.length > 0 && (
                <div className="importDetailList importDetailListErr">
                  <h4>&#x2715; Errors — rows not imported</h4>
                  {result.skippedRows.map((row) => (
                    <div key={`skip-${row.rowNumber}`} className="importDetailItem">
                      <span className="importDetailRow importDetailRowErr">Row {row.rowNumber}</span>
                      <span>{row.tagNumber ? `(${row.tagNumber}) ` : ""}{row.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="importFooter">
          <div className="importFooterLeft">
            {showBack && (
              <button
                className="importBtnSecondary"
                onClick={() => setStep("template")}
                type="button"
              >
                ← Back
              </button>
            )}
            {footerHint && (
              <span className="importFooterHint">{footerHint}</span>
            )}
          </div>
          <button
            className="importBtnPrimary"
            disabled={primaryDisabled}
            onClick={primaryAction}
            type="button"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
