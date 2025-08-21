import React, { useEffect, useState } from "react";
import Select from "react-select";

export default function SelectUFSearch() {
  const [ufOptions, setUfOptions] = useState([]);
  const [selectedUF, setSelectedUF] = useState(null);

  const [districtOptions, setDistrictOptions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  const [selectedYear, setSelectedYear] = useState(null);
  const [feriadosExtraidos, setFeriadosExtraidos] = useState([]);

  // Gera lista de anos do ano atual e soma 5 anos
  const year = new Date().getFullYear();
  const yearOptions = Array.from({ length: 6 }, (_, i) => {
    const currentYear = year + i;
    return { value: currentYear, label: currentYear.toString() };
  });

  // Carrega UFs
  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados")
      .then((response) => response.json())
      .then((data) => {
        const sortedOptions = data
          .sort((a, b) => a.sigla.localeCompare(b.sigla))
          .map((uf) => ({
            value: uf.sigla.toLowerCase(),
            label: uf.sigla,
          }));
        setUfOptions(sortedOptions);
      })
      .catch((error) => console.error("Erro ao buscar UFs:", error));
  }, []);

  // Carrega distritos ao mudar UF
  useEffect(() => {
    if (selectedUF?.value) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUF.value}/distritos`)
        .then((response) => response.json())
        .then((data) => {
          const districtList = data
            .sort((a, b) => a.nome.localeCompare(b.nome)) // <-- ordenação alfabética
            .map((district) => ({
              value: district.id,
              label: district.nome,
            }));
          setDistrictOptions(districtList);
          setSelectedDistrict(null);
        })
        .catch((error) => console.error("Erro ao buscar distritos:", error));
    } else {
      setDistrictOptions([]);
      setSelectedDistrict(null);
    }
  }, [selectedUF]);

  // Função chamada ao clicar no botão
  const handleSubmit = () => {
    const uf = selectedUF?.value.toUpperCase() || 'UF não selecionada';
    const distrito = selectedDistrict?.label.replace(/\s+/g, "_") || 'Cidade não selecionada';
    const ano = selectedYear?.value || 'Ano não selecionado';

    // Monta a URL original
    const url = `https://www.feriados.com.br/feriados-${distrito}-${uf}.php?ano=${ano}`;
    console.log("URL da requisição:", url);

    // Usa o proxy do AllOrigins
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;

    fetch(proxyUrl)
      .then(res => res.json())
      .then(data => {
        const html = data.contents;
        
        // Parse do HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Extrai os feriados corretos (li dentro da ul.multi-column)
        const feriados = [];
        doc.querySelectorAll("ul.multi-column li").forEach(li => {
          const span = li.querySelector("span");
          if (span) {
            const text = span.innerText.trim();

            // Divide a data e a descrição
            const [data, ...descricaoParts] = text.split(" - ");

            feriados.push({
              data: data.trim(),
              descricao: descricaoParts.join(" - ").trim(),
              facultativo: span.classList.contains("style_lista_facultativos") // true = facultativo, false = feriado normal
            });
          }
        });

        // Exibe os feriados extraídos no console
        console.log("Feriados extraídos:", feriados);
        setFeriadosExtraidos(feriados);

      })
      .catch(err => console.error("Erro ao buscar:", err));

      // Abrir a URL em uma nova aba
      window.open(url, '_blank');
  };


  return (
    <div>
      <div style={{ display: 'flex', gap: 100, justifyContent: 'center', marginTop: 50 }}>
        <div style={{ width: 300 }}>
          <h3>Selecione a UF:</h3>
          <Select
            options={ufOptions}
            value={selectedUF}
            onChange={setSelectedUF}
            placeholder="Selecione a UF..."
            isClearable
            onInputChange={(inputValue, { action }) => {
              if (action === "input-change") {
                return inputValue.toUpperCase();
              }
              return inputValue;
            }}
          />
        </div>

        <div style={{ width: 300 }}>
          <h3>Selecione o Distrito:</h3>
          <Select
            options={districtOptions}
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            placeholder="Selecione o distrito..."
            isClearable
            isDisabled={!selectedUF}
          />
        </div>

        <div style={{ width: 300 }}>
          <h3>Selecione o Ano:</h3>
          <Select
            options={yearOptions}
            value={selectedYear}
            onChange={setSelectedYear}
            placeholder="Selecione o ano..."
            isClearable
          />
        </div>
      </div>

      {/* Botão abaixo das selects */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30 }}>
        <button
          onClick={handleSubmit}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            cursor: 'pointer',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: 4
          }}
        >
          Carregar Feriados
        </button>
      </div>

      {feriadosExtraidos.length > 0 && (
        <div style={{ marginTop: 40, textAlign: 'left', maxWidth: 600, marginInline: 'auto' }}>
          <h2 style={{ textAlign: 'center' }}>
            Feriados {selectedDistrict?.label} {selectedYear?.value}
          </h2>
          <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 40,
                flexWrap: 'wrap',
                marginTop: 20,
              }}
            >
              {[0, 1].map((columnIndex) => (
                <ul key={columnIndex} style={{ listStyle: 'disc', padding: 0, width: '45%' }}>
                  {feriadosExtraidos
                    .filter((_, idx) =>
                      columnIndex === 0
                        ? idx < Math.ceil(feriadosExtraidos.length / 2)
                        : idx >= Math.ceil(feriadosExtraidos.length / 2)
                    )
                    .map((feriado, index) => (
                      <li
                        key={index}
                        style={{
                          color: feriado.facultativo ? 'gray' : 'black',
                          marginBottom: 6,
                          fontSize: 16,
                          whiteSpace: 'nowrap', 
                        }}
                        title={feriado.facultativo ? "Feriado Facultativo" : "Feriado Nacional"}
                      >
                        {feriado.data} - {feriado.descricao}
                      </li>
                    ))}
                </ul>
              ))}
            </div>
        </div>
      )}

    </div>
  );
}
