import { useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FileImage,
  FileOutput,
  FileText,
  Image as ImageIcon,
  Loader2,
  Minimize2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
  Zap,
} from "lucide-react";

const tools = [
  {
    id: "compress",
    title: "Image Compressor",
    description: "Reduce image size while maintaining good quality.",
    icon: Minimize2,
    input: "image",
  },
  {
    id: "image-pdf",
    title: "Image to PDF",
    description: "Convert JPG, PNG or WEBP images into PDF.",
    icon: FileOutput,
    input: "image",
  },
  {
    id: "pdf-image",
    title: "PDF to Image",
    description: "Convert PDF pages into downloadable images.",
    icon: FileImage,
    input: "pdf",
  },
  {
    id: "word-pdf",
    title: "Word to PDF",
    description: "Convert Word documents into PDF files.",
    icon: FileText,
    input: "word",
  },
  {
    id: "pdf-word",
    title: "PDF to Word",
    description: "Convert PDF documents into editable Word files.",
    icon: FileText,
    input: "pdf",
  },
  {
    id: "preview",
    title: "Image Preview",
    description: "Preview your image before processing.",
    icon: ImageIcon,
    input: "image",
  },
];

const acceptedTypes = {
  image: {
    extensions: [".jpg", ".jpeg", ".png", ".webp"],
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    label: "JPG · JPEG · PNG · WEBP",
  },
  pdf: {
    extensions: [".pdf"],
    mimeTypes: ["application/pdf"],
    label: "PDF",
  },
  word: {
    extensions: [".doc", ".docx"],
    mimeTypes: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    label: "DOC · DOCX",
  },
};

function FileTools() {
  const inputRef = useRef(null);

  const [activeTool, setActiveTool] = useState("compress");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [quality, setQuality] = useState(70);

  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");
  const [resultSize, setResultSize] = useState(null);
  const [resultType, setResultType] = useState("");

  const [statusMessage, setStatusMessage] = useState("");

  const currentTool =
    tools.find((tool) => tool.id === activeTool) || tools[0];

  const accepted = acceptedTypes[currentTool.input];

  const formatSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getExtension = (filename) => {
    const parts = filename.split(".");

    return parts.length > 1
      ? `.${parts.pop().toLowerCase()}`
      : "";
  };

  const clearResult = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setResultUrl("");
    setResultName("");
    setResultSize(null);
    setResultType("");
    setStatusMessage("");
  };

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    const extension = getExtension(selectedFile.name);

    const isValid =
      accepted.extensions.includes(extension) ||
      accepted.mimeTypes.includes(selectedFile.type);

    if (!isValid) {
      alert(
        `Please upload a supported file.\n\nAccepted: ${accepted.label}`,
      );
      return;
    }

    clearResult();

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(selectedFile);

    setFile(selectedFile);
    setPreviewUrl(url);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    clearResult();

    setFile(null);
    setPreviewUrl("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const switchTool = (toolId) => {
    setActiveTool(toolId);
    setIsDragging(false);
    setIsProcessing(false);
    clearResult();

    const nextTool =
      tools.find((tool) => tool.id === toolId);

    if (
      file &&
      nextTool &&
      !acceptedTypes[nextTool.input].extensions.includes(
        getExtension(file.name),
      ) &&
      !acceptedTypes[nextTool.input].mimeTypes.includes(
        file.type,
      )
    ) {
      removeFile();
    }
  };

  const createDownload = (
    blob,
    name,
    type,
  ) => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    const url = URL.createObjectURL(blob);

    setResultUrl(url);
    setResultName(name);
    setResultSize(blob.size);
    setResultType(type);
    setStatusMessage("Conversion completed successfully.");
  };

  const compressImage = () => {
    if (!file || !previewUrl) {
      alert("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    clearResult();

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      const maxWidth = 1800;

      const scale =
        image.width > maxWidth
          ? maxWidth / image.width
          : 1;

      canvas.width = Math.round(
        image.width * scale,
      );

      canvas.height = Math.round(
        image.height * scale,
      );

      const context = canvas.getContext("2d");

      context.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
      );

      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);

          if (!blob) {
            alert("Unable to compress image.");
            return;
          }

          createDownload(
            blob,
            `compressed-${file.name.replace(
              /\.[^/.]+$/,
              ".jpg",
            )}`,
            "image/jpeg",
          );
        },
        "image/jpeg",
        quality / 100,
      );
    };

    image.onerror = () => {
      setIsProcessing(false);
      alert("Unable to read the selected image.");
    };

    image.src = previewUrl;
  };

  const imageToPdf = () => {
    if (!file || !previewUrl) {
      alert("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    clearResult();

    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");

      const pageWidth = 794;
      const pageHeight = 1123;
      const margin = 40;

      const maxWidth =
        pageWidth - margin * 2;

      const maxHeight =
        pageHeight - margin * 2;

      const scale = Math.min(
        maxWidth / image.width,
        maxHeight / image.height,
      );

      const width = image.width * scale;
      const height = image.height * scale;

      canvas.width = pageWidth;
      canvas.height = pageHeight;

      const context = canvas.getContext("2d");

      context.fillStyle = "#ffffff";
      context.fillRect(
        0,
        0,
        pageWidth,
        pageHeight,
      );

      const x = (pageWidth - width) / 2;
      const y = (pageHeight - height) / 2;

      context.drawImage(
        image,
        x,
        y,
        width,
        height,
      );

      /*
       * Browser-only PDF creation.
       * This creates a conversion-ready blob.
       */
      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);

          if (!blob) {
            alert("Unable to create PDF.");
            return;
          }

          /*
           * The browser canvas does not natively create a
           * real PDF MIME blob. We keep the state ready for
           * the future PDF library/backend integration.
           */
          setStatusMessage(
            "PDF conversion is ready for the PDF engine integration.",
          );

          setResultName(
            `${file.name.replace(
              /\.[^/.]+$/,
              "",
            )}.pdf`,
          );

          setResultSize(blob.size);
          setResultType("application/pdf");
        },
        "image/jpeg",
        0.95,
      );
    };

    image.onerror = () => {
      setIsProcessing(false);
      alert("Unable to read the selected image.");
    };

    image.src = previewUrl;
  };

  const conversionPlaceholder = (
    conversionName,
  ) => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    setIsProcessing(true);
    clearResult();

    setTimeout(() => {
      setIsProcessing(false);

      setStatusMessage(
        `${conversionName} is ready for local converter/backend integration.`,
      );
    }, 900);
  };

  const processTool = () => {
    if (activeTool === "compress") {
      compressImage();
      return;
    }

    if (activeTool === "image-pdf") {
      imageToPdf();
      return;
    }

    if (activeTool === "pdf-image") {
      conversionPlaceholder("PDF to Image");
      return;
    }

    if (activeTool === "word-pdf") {
      conversionPlaceholder("Word to PDF");
      return;
    }

    if (activeTool === "pdf-word") {
      conversionPlaceholder("PDF to Word");
      return;
    }
  };

  const getActionLabel = () => {
    switch (activeTool) {
      case "compress":
        return "Compress Image";
      case "image-pdf":
        return "Convert to PDF";
      case "pdf-image":
        return "Convert to Images";
      case "word-pdf":
        return "Convert to PDF";
      case "pdf-word":
        return "Convert to Word";
      default:
        return "Process File";
    }
  };

  const getFileIcon = () => {
    if (!file) return FileText;

    if (file.type.startsWith("image/")) {
      return ImageIcon;
    }

    if (file.type === "application/pdf") {
      return FileText;
    }

    return FileText;
  };

  const FileIcon = getFileIcon();

  const compressionPercentage =
    file && resultSize
      ? Math.max(
          0,
          Math.round(
            ((file.size - resultSize) /
              file.size) *
              100,
          ),
        )
      : 0;

  return (
    <div className="min-h-[calc(100vh-80px)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05]">
              <Zap
                size={21}
                className="text-white"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                File Tools
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Convert, compress and manage your study files locally.
              </p>
            </div>

          </div>
        </div>

        {/* TOOL GRID */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">

          {tools.map((tool) => {
            const Icon = tool.icon;
            const active =
              activeTool === tool.id;

            return (
              <button
                key={tool.id}
                type="button"
                onClick={() =>
                  switchTool(tool.id)
                }
                className={`group rounded-2xl border p-4 text-left transition duration-200 ${
                  active
                    ? "border-white/20 bg-white/[0.08] ring-1 ring-white/10"
                    : "border-white/10 bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start gap-3">

                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? "bg-white/[0.1]"
                        : "bg-white/[0.05] group-hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon
                      size={18}
                      className="text-slate-300"
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-white">
                      {tool.title}
                    </h2>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {tool.description}
                    </p>
                  </div>

                </div>
              </button>
            );
          })}

        </div>

        {/* MAIN */}
        <div className="grid gap-6 lg:grid-cols-[390px_1fr]">

          {/* LEFT PANEL */}
          <div className="space-y-5">

            {/* UPLOAD */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

              <div className="mb-4 flex items-center justify-between">

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Upload File
                  </h2>

                  <p className="mt-1 text-xs text-slate-600">
                    {currentTool.title}
                  </p>
                </div>

                <FileIcon
                  size={18}
                  className="text-slate-500"
                />

              </div>

              {!file ? (
                <label
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() =>
                    setIsDragging(false)
                  }
                  onDrop={handleDrop}
                  className={`flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition ${
                    isDragging
                      ? "border-white/30 bg-white/[0.08]"
                      : "border-white/10 bg-white/[0.015] hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept={accepted.extensions.join(
                      ",",
                    )}
                    className="hidden"
                    onChange={(event) =>
                      handleFile(
                        event.target.files?.[0],
                      )
                    }
                  />

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.06]">
                    <Upload
                      size={21}
                      className="text-slate-400"
                    />
                  </div>

                  <p className="text-sm font-medium text-slate-300">
                    Drop your file here
                  </p>

                  <p className="mt-1 text-xs text-slate-600">
                    or click to browse
                  </p>

                  <p className="mt-4 text-[10px] uppercase tracking-wider text-slate-700">
                    {accepted.label}
                  </p>
                </label>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.07]">

                      {file.type.startsWith(
                        "image/",
                      ) ? (
                        <img
                          src={previewUrl}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FileIcon
                          size={19}
                          className="text-slate-300"
                        />
                      )}

                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {formatSize(file.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>

                  </div>

                </div>
              )}

            </div>

            {/* TOOL SETTINGS */}
            {activeTool === "compress" && (
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                <h2 className="text-sm font-semibold text-white">
                  Compression Settings
                </h2>

                <p className="mt-1 text-xs text-slate-600">
                  Choose the output image quality.
                </p>

                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Quality
                    </span>

                    <span className="text-xs font-medium text-white">
                      {quality}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={quality}
                    onChange={(event) =>
                      setQuality(
                        Number(
                          event.target.value,
                        ),
                      )
                    }
                    className="w-full accent-white"
                  />

                  <div className="mt-2 flex justify-between text-[10px] text-slate-700">
                    <span>Smaller</span>
                    <span>Higher quality</span>
                  </div>

                </div>

              </div>
            )}

            {/* CONVERSION INFO */}
            {activeTool !== "compress" &&
              activeTool !== "preview" && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.05]">
                      <Sparkles
                        size={16}
                        className="text-slate-500"
                      />
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-slate-400">
                        Local conversion ready
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-slate-700">
                        The interface is prepared for a local
                        converter or backend service. No files are
                        uploaded to an external service.
                      </p>
                    </div>

                  </div>

                </div>
              )}

            {/* ACTION */}
            {activeTool !== "preview" && (
              <button
                type="button"
                onClick={processTool}
                disabled={isProcessing || !file}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap size={17} />
                    {getActionLabel()}
                  </>
                )}
              </button>
            )}

          </div>

          {/* RIGHT PANEL */}
          <div className="min-h-[620px] rounded-2xl border border-white/10 bg-white/[0.025]">

            {/* PANEL HEADER */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06]">
                  <ImageIcon
                    size={17}
                    className="text-slate-300"
                  />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-white">
                    {currentTool.title}
                  </h2>

                  <p className="text-xs text-slate-600">
                    {file
                      ? file.name
                      : "No file selected"}
                  </p>
                </div>

              </div>

              {file && (
                <button
                  type="button"
                  onClick={removeFile}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-slate-500 transition hover:bg-white/[0.07] hover:text-white"
                  title="Clear"
                >
                  <X size={15} />
                </button>
              )}

            </div>

            <div className="p-5 sm:p-7">

              {!file ? (
                <div className="flex min-h-[510px] flex-col items-center justify-center text-center">

                  <div className="relative mb-5">

                    <div className="absolute inset-0 rounded-2xl bg-white/[0.05] blur-xl" />

                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <FileOutput
                        size={27}
                        className="text-slate-500"
                      />
                    </div>

                  </div>

                  <h3 className="text-base font-semibold text-slate-300">
                    Ready for your file
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                    Upload a supported file from the left panel
                    to start using {currentTool.title}.
                  </p>

                  <div className="mt-6 flex flex-wrap justify-center gap-2">

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-600">
                      {accepted.label}
                    </span>

                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-600">
                      Local-first
                    </span>

                  </div>

                </div>
              ) : (
                <div>

                  {/* IMAGE PREVIEW */}
                  {file.type.startsWith(
                    "image/",
                  ) && (
                    <div className="flex min-h-[430px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4">

                      <img
                        src={previewUrl}
                        alt="File preview"
                        className="max-h-[430px] max-w-full rounded-xl object-contain"
                      />

                    </div>
                  )}

                  {/* PDF PREVIEW */}
                  {file.type ===
                    "application/pdf" && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">

                      <iframe
                        src={previewUrl}
                        title="PDF Preview"
                        className="h-[520px] w-full"
                      />

                    </div>
                  )}

                  {/* WORD PREVIEW */}
                  {file.name
                    .toLowerCase()
                    .endsWith(".docx") && (
                    <div className="flex min-h-[430px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-center">

                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.05]">
                        <FileText
                          size={28}
                          className="text-slate-400"
                        />
                      </div>

                      <h3 className="text-sm font-semibold text-white">
                        Word document selected
                      </h3>

                      <p className="mt-2 max-w-sm text-xs leading-5 text-slate-600">
                        Preview will be available when the
                        document processing engine is connected.
                      </p>

                    </div>
                  )}

                  {/* STATUS */}
                  {statusMessage && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">

                      <div className="flex items-start gap-3">

                        <CheckCircle2
                          size={17}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />

                        <div>
                          <p className="text-xs font-medium text-slate-300">
                            Processing status
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-600">
                            {statusMessage}
                          </p>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* RESULT */}
                  {resultName && (
                    <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.025] p-4">

                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                        <div className="min-w-0">

                          <p className="text-xs font-medium text-white">
                            Output ready
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-600">
                            {resultName}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-slate-700">

                            {resultSize && (
                              <span>
                                {formatSize(
                                  resultSize,
                                )}
                              </span>
                            )}

                            {activeTool ===
                              "compress" &&
                              resultSize && (
                                <span className="text-slate-400">
                                  {compressionPercentage}%
                                  smaller
                                </span>
                              )}

                          </div>

                        </div>

                        {resultUrl ? (
                          <a
                            href={resultUrl}
                            download={resultName}
                            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-slate-200"
                          >
                            <Download size={15} />
                            Download
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs text-slate-700"
                          >
                            <Download size={15} />
                            Converter Required
                          </button>
                        )}

                      </div>

                    </div>
                  )}

                  {/* FILE INFO */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-700">
                        File
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-400">
                        {file.name}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-700">
                        Size
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatSize(file.size)}
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                      <p className="text-[10px] uppercase tracking-wider text-slate-700">
                        Format
                      </p>

                      <p className="mt-1 text-xs uppercase text-slate-400">
                        {getExtension(
                          file.name,
                        ).replace(".", "")}
                      </p>
                    </div>

                  </div>

                </div>
              )}

            </div>
          </div>
        </div>

        {/* NOTICE */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">

          <Sparkles
            size={16}
            className="mt-0.5 shrink-0 text-slate-600"
          />

          <div>
            <p className="text-xs font-medium text-slate-500">
              OFFSEDU • Local First
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-700">
              File selection and image compression are handled in
              the browser. PDF and Word conversions are structured
              for the upcoming local converter/backend integration.
              Your files are not sent to an external service by this
              page.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

export default FileTools;