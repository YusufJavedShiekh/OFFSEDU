import { useRef, useState } from "react";
import {
  Download,
  FileImage,
  FileOutput,
  FileText,
  Image as ImageIcon,
  Minimize2,
  Upload,
  X,
  CheckCircle2,
  Loader2,
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
    description: "Convert JPG, PNG or WEBP images into PDF files.",
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

function getExtension(fileName) {
  const index = fileName.lastIndexOf(".");

  if (index === -1) return "";

  return fileName.slice(index).toLowerCase();
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTools() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [resultName, setResultName] = useState("");

  const fileInputRef = useRef(null);

  const clearResult = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
    }

    setResultUrl("");
    setResultName("");
  };

  const resetTool = () => {
    clearResult();
    setFile(null);
    setStatusMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const selectTool = (tool) => {
    resetTool();
    setSelectedTool(tool);
  };

  const closeTool = () => {
    resetTool();
    setSelectedTool(null);
  };

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile || !selectedTool) return;

    const config = acceptedTypes[selectedTool.input];
    const extension = getExtension(selectedFile.name);

    const extensionAllowed = config.extensions.includes(extension);
    const mimeAllowed =
      !selectedFile.type || config.mimeTypes.includes(selectedFile.type);

    if (!extensionAllowed || !mimeAllowed) {
      alert(
        `Unsupported file type. Please upload: ${config.label.replaceAll(
          " · ",
          ", ",
        )}.`,
      );

      event.target.value = "";
      return;
    }

    clearResult();
    setStatusMessage("");
    setFile(selectedFile);
  };

  const compressImage = () => {
    if (!file) {
      alert("Please upload an image first.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image.");
      return;
    }

    setIsProcessing(true);
    clearResult();
    setStatusMessage("");

    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");

      const maxWidth = 1800;
      const scale = Math.min(1, maxWidth / image.width);

      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        setIsProcessing(false);
        setStatusMessage("Unable to process this image.");
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);

          if (!blob) {
            setIsProcessing(false);
            setStatusMessage("Compression failed.");
            return;
          }

          const url = URL.createObjectURL(blob);

          setResultUrl(url);
          setResultName(
            `${file.name.replace(/\.[^/.]+$/, "")}-compressed.jpg`,
          );

          setIsProcessing(false);

          setStatusMessage(
            `Image compressed from ${formatFileSize(
              file.size,
            )} to ${formatFileSize(blob.size)}.`,
          );
        },
        "image/jpeg",
        0.78,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setIsProcessing(false);
      setStatusMessage("Unable to read this image.");
    };

    image.src = objectUrl;
  };

  const previewImage = () => {
    if (!file) {
      alert("Please upload an image first.");
      return;
    }

    const url = URL.createObjectURL(file);

    setResultUrl(url);
    setResultName(file.name);
    setStatusMessage("Image preview is ready.");
  };

  const imageToPdfPlaceholder = () => {
    if (!file) {
      alert("Please upload an image first.");
      return;
    }

    setIsProcessing(true);
    clearResult();
    setStatusMessage("");

    setTimeout(() => {
      setIsProcessing(false);
      setStatusMessage(
        "Image to PDF is ready for local PDF converter/backend integration.",
      );
    }, 900);
  };

  const conversionPlaceholder = (conversionName) => {
    if (!file) {
      alert("Please upload a file first.");
      return;
    }

    setIsProcessing(true);
    clearResult();
    setStatusMessage("");

    setTimeout(() => {
      setIsProcessing(false);

      setStatusMessage(
        `${conversionName} is ready for local converter/backend integration.`,
      );
    }, 900);
  };

  const processTool = () => {
    if (!selectedTool) return;

    switch (selectedTool.id) {
      case "compress":
        compressImage();
        break;

      case "preview":
        previewImage();
        break;

      case "image-pdf":
        imageToPdfPlaceholder();
        break;

      case "pdf-image":
        conversionPlaceholder("PDF to Image");
        break;

      case "word-pdf":
        conversionPlaceholder("Word to PDF");
        break;

      case "pdf-word":
        conversionPlaceholder("PDF to Word");
        break;

      default:
        break;
    }
  };

  const downloadResult = () => {
    if (!resultUrl) return;

    const link = document.createElement("a");

    link.href = resultUrl;
    link.download = resultName || "offsedu-output";

    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-gradient-to-br from-[#063b3b] via-[#06272d] to-[#03070b] px-4 py-6 sm:px-6 lg:px-8">
      {/* Background atmosphere */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-20 h-[420px] w-[420px] rounded-full bg-teal-500/10 blur-3xl" />

        <div className="absolute right-[-120px] top-1/4 h-[480px] w-[480px] rounded-full bg-cyan-500/10 blur-3xl" />

        <div className="absolute bottom-[-180px] left-1/3 h-[420px] w-[420px] rounded-full bg-teal-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-teal-300/20 bg-teal-400/10 text-teal-300">
              <FileOutput size={22} />
            </div>

            <div>
              <p className="text-sm font-medium text-teal-300">
                Local File Utilities
              </p>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                File Tools
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            Compress, preview and convert your study files with simple local
            tools.
          </p>
        </div>

        {!selectedTool ? (
          <>
            {/* Tool grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => selectTool(tool)}
                    className="group rounded-3xl border border-white/10 bg-[#061214]/65 p-6 text-left shadow-xl shadow-black/10 backdrop-blur-xl transition hover:border-teal-300/20 hover:bg-[#071719]/80"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-teal-300 transition group-hover:bg-teal-400/15">
                        <Icon size={23} />
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1 text-[11px] text-slate-500">
                        {tool.input === "image"
                          ? "IMAGE"
                          : tool.input === "pdf"
                            ? "PDF"
                            : "WORD"}
                      </span>
                    </div>

                    <h2 className="mt-6 text-lg font-semibold text-white">
                      {tool.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {tool.description}
                    </p>

                    <div className="mt-5 flex items-center gap-2 text-sm font-medium text-teal-300">
                      Open Tool
                      <span className="transition-transform group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Local info */}
            <div className="mt-6 rounded-3xl border border-white/10 bg-[#061214]/55 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                  <CheckCircle2 size={21} />
                </div>

                <div>
                  <h3 className="font-medium text-white">
                    Designed for local processing
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    OFFSEDU is being designed around privacy-first local
                    workflows. Advanced converters will connect to the local
                    processing layer later.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Tool workspace */}
            <div className="mx-auto max-w-4xl">
              <button
                type="button"
                onClick={closeTool}
                className="mb-5 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-teal-300"
              >
                ← Back to File Tools
              </button>

              <div className="rounded-3xl border border-white/10 bg-[#061214]/70 p-5 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-7">
                {/* Tool heading */}
                <div className="mb-7 flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-teal-300">
                    <selectedTool.icon size={23} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-white">
                      {selectedTool.title}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {selectedTool.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeTool}
                    className="ml-auto rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <X size={19} />
                  </button>
                </div>

                {/* Upload area */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-3xl border border-dashed border-teal-300/20 bg-teal-400/[0.035] p-8 text-center transition hover:border-teal-300/35 hover:bg-teal-400/[0.06] sm:p-12"
                >
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-teal-300/15 bg-teal-400/10 text-teal-300">
                    <Upload size={27} />
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-white">
                    {file ? "Choose another file" : "Upload your file"}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    {acceptedTypes[selectedTool.input].label}
                  </p>

                  {file && (
                    <div className="mx-auto mt-5 max-w-lg rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <p className="truncate text-sm font-medium text-teal-300">
                        {file.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-600">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes[selectedTool.input].extensions.join(",")}
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Action */}
                <button
                  type="button"
                  onClick={processTool}
                  disabled={!file || isProcessing}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500/90 px-5 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <selectedTool.icon size={18} />
                      {selectedTool.id === "preview"
                        ? "Preview Image"
                        : `Process ${selectedTool.title}`}
                    </>
                  )}
                </button>

                {/* Status */}
                {statusMessage && (
                  <div className="mt-5 flex items-start gap-3 rounded-2xl border border-teal-300/10 bg-teal-400/[0.04] p-4">
                    <CheckCircle2
                      size={19}
                      className="mt-0.5 shrink-0 text-teal-300"
                    />

                    <p className="text-sm leading-6 text-slate-400">
                      {statusMessage}
                    </p>
                  </div>
                )}

                {/* Result */}
                {resultUrl && (
                  <div className="mt-6 rounded-3xl border border-white/10 bg-black/15 p-4 sm:p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-white">
                          Output
                        </h3>

                        <p className="mt-1 truncate text-xs text-slate-600">
                          {resultName}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={downloadResult}
                        className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-teal-400"
                      >
                        <Download size={17} />
                        Download
                      </button>
                    </div>

                    {selectedTool.id === "preview" ||
                    selectedTool.id === "compress" ? (
                      <div className="flex min-h-[300px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 p-4">
                        <img
                          src={resultUrl}
                          alt="Processed result"
                          className="max-h-[520px] max-w-full rounded-xl object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] text-center">
                        <div>
                          <FileOutput
                            size={36}
                            className="mx-auto text-teal-300"
                          />

                          <p className="mt-3 text-sm text-slate-500">
                            Output will appear here after local converter
                            integration.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tool note */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-[#061214]/50 p-4 backdrop-blur-xl">
                <div className="flex gap-3">
                  <FileText
                    size={18}
                    className="mt-0.5 shrink-0 text-slate-500"
                  />

                  <p className="text-xs leading-5 text-slate-600">
                    Some conversion tools currently use a frontend placeholder.
                    They are intentionally ready for connection with the local
                    OFFSEDU processing layer later.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FileTools;