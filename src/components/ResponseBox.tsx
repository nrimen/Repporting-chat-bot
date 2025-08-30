type ResponseProps = {
  response: string[][] | null;
};

export function ResponseBox({ response }: ResponseProps) {
  return (
    <section className="col-span-1 lg:col-span-1 border border-gray-300 rounded-2xl p-6 overflow-auto bg-white shadow-xl max-h-[600px]">
      <h2 className="font-semibold mb-6 text-gray-900 text-xl border-b border-indigo-300 pb-2">
        Réponse :
      </h2>
      {response ? (
        <table className="w-full border-collapse table-auto text-sm">
          <thead>
            <tr className="bg-indigo-100 text-indigo-900">
              {response[0].map((heading, i) => (
                <th
                  key={i}
                  className="p-3 border border-indigo-200 text-left font-semibold"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-slate-800">
            {response.slice(1).map((row, i) => (
              <tr
                key={i}
                className="hover:bg-indigo-50 transition-colors duration-200"
              >
                {row.map((cell, j) => (
                  <td key={j} className="p-3 border border-indigo-100">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Aucune réponse pour le moment.</p>
      )}
    </section>
  );
}