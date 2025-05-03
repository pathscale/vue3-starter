export function exportToCsv(filename: string, data: Record<string, unknown>[]) {
  const csvFile = data
    .map((d) => `"${Object.values(d)}"`)
    .join("\n")
    .replace(/(^\[)|(]$)/gm, "");
  const blob = new Blob([csvFile], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    // feature detection
    // Browsers that support HTML5 download attribute
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.append(link);
    link.click();
    link.remove();
  }
}

export function getHeaders(str: string, delimiter = ","): string[] {
  return str
    .slice(0, str.indexOf("\n"))
    .split(delimiter)
    .map((e) => e.replace(/\r/g, "")) as string[];
}

export function getRows(str: string, delimiter = ","): string[][] {
  const rows = str
    .slice(str.indexOf("\n") + 1)
    .split("\n")
    .filter((row) => row !== "");

  return rows.map((row) =>
    row.split(delimiter).map((e) => e.replace(/\r/g, "")),
  );
}

export function csvToArray(
  str: string,
  delimiter = ",",
): Record<string, unknown>[] {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = getHeaders(str, delimiter);

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row

  const rows = str
    .slice(str.indexOf("\n") + 1)
    .split("\n")
    .filter((row) => row !== "")
    .map((e) => e.replace(/\r/g, ""));

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map((row) => {
    const values = row.split(delimiter);
    const el = headers.reduce((object, header, index) => {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
}
