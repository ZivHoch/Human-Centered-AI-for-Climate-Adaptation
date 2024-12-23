window.onload = function () {
  datasetSelection.init();
  selectionPanel.init();
};

const datasetSelection = (function () {
  return {
    // TODO: replace index by id
    currentLoadedDatasetIndex: 0,
    currentId: "",

    init: function () {
      currentLoadedDatasetIndex = 0;
      this.currentId = Object.keys(window.datasets)[0];
      window.currentDatasetId = this.currentId;
      const datasetDropDown = $("#datasetDropDown");
      datasetDropDown.append($(`<option value="1">bin for every year</option>`));
      for (let i = 2; i <= 13; i++) {
        const option = $(`<option value="${i}">bin for every ${i} years</option>`);
        if (i === 4) {
          option.attr("selected", "selected"); // Set default value to 4
        }
        datasetDropDown.append(option);
      }
      datasetDropDown.on("change", (e) => {
        const selectedValue = e.target.value; // Access the selected value
        this.refresh(this.currentId, selectedValue);
      });
      const arr = [];

      // Use Object.keys to iterate over datasets
      if (window.datasets && typeof window.datasets === "object") {
        for (const dataset of Object.keys(window.datasets)) {
          const temp = [Math.random() * 100, Math.random() * 100, Math.random() * 100, Math.random() * 100];
          const min = Math.min(...temp);
          const max = Math.max(...temp);
          arr.push({
            name: dataset,
            Objective_1: temp[0],
            Objective_2: temp[1],
            Objective_3: temp[2],
            Objective_4: temp[3],
          });
        }
      } else {
        console.error("window.datasets is not a valid object.");
      }

      // Ensure the container exists for LineUpJS visualization
      const lineupContainer = document.getElementById("lineupVisualization");

      if (lineupContainer) {
        // Create LineUpJS builder
        const builder = LineUpJS.builder(arr);

        // Define columns dynamically
        builder
          .column(LineUpJS.buildStringColumn("name").label("Name").width(150))
          .column(LineUpJS.buildNumberColumn("Objective_1", [0, 100]).label("First Objective").color("green").width(150))
          .column(LineUpJS.buildNumberColumn("Objective_2", [0, 100]).label("Second Objective").color("blue").width(150))
          .column(LineUpJS.buildNumberColumn("Objective_3", [0, 100]).label("Third Objective").color("orange").width(150))
          .column(LineUpJS.buildNumberColumn("Objective_4", [0, 100]).label("Fourth Objective").color("purple").width(150));

        // Define ranking
        const ranking = LineUpJS.buildRanking().sortBy("name", "asc"); // Sort rows by 'name' in ascending order

        // Set default ranking
        builder.defaultRanking(ranking);

        // Build LineUp visualization
        const lineup = builder.buildTaggle(lineupContainer);

        // Listen to selection events
        lineup.on("selectionChanged", (selectedIndices) => {
          if (selectedIndices.length > 0) {
            const selectedRow = arr[selectedIndices[0]];
            const selectedValue = $("#datasetDropDown").val();
            this.currentId = selectedRow.name;
            this.refresh(this.currentId, selectedValue);
          } else {
            console.log("No dataset selected.");
          }
        });
      } else {
        console.error("LineUpJS container not found.");
      }
      this.refresh(this.currentId, 4);
    },

    toggleDataSetInformation: function () {
      $("#id01").toggle();
    },
    refresh: function (id, ver) {
      visObject = DynaSet().loadHarcodedDatasetFromJavascriptObject(id, ver);
      selectionPanel.init();
      document.querySelector("#countA").textContent = ": 0";
      document.querySelector("#countB").textContent = ": 0";
      document.querySelector("#countAB").textContent = ": 0";
    },
  };
})();
// const datasetSelection = (function () {
//   return {
//     currentLoadedDatasetIndex: 0,
//     currentId: "",

//     init: function () {
//       this.currentId = Object.keys(window.datasets)[0];
//       window.currentDatasetId = this.currentId;
//       const datasetDropDown = $("#datasetDropDown");

//       // Clear any existing content
//       datasetDropDown.html("");

//       // Add checkboxes and options
//       Object.keys(window.datasets).forEach((datasetId) => {
//         const dataset = window.datasets[datasetId];
//         const optionElement = $(`
//             <div class="dataset-option">
//               <input type="checkbox" id="checkbox_${datasetId}" value="${datasetId}">
//               <label for="checkbox_${datasetId}">${dataset.name}</label>
//             </div>
//           `);
//         datasetDropDown.append(optionElement);
//       });

//       // Load the first dataset by default
//       visObject = DynaSet().loadHarcodedDatasetFromJavascriptObject(this.currentId);

//       // Add change event listener for checkboxes
//       datasetDropDown.on("change", "input[type='checkbox']", function () {
//         const selectedDatasets = [];
//         datasetDropDown.find("input[type='checkbox']:checked").each(function () {
//           selectedDatasets.push($(this).val());
//         });

//         // For simplicity, use the first selected dataset to load
//         if (selectedDatasets.length > 0) {
//           datasetSelection.currentId = selectedDatasets[0];
//           window.currentDatasetId = datasetSelection.currentId;
//           visObject.loadHarcodedDatasetFromJavascriptObject(datasetSelection.currentId);
//           selectionPanel.init();
//         }
//       });
//     },

//     toggleDataSetInformation: function () {
//       $("#id01").toggle();
//     },
//   };
// })();
const selectionPanel = (function () {
  function initGroupSelection(group) {
    const selectionDiv = $(`#selection${group}`);
    selectionDiv.html("");
    // TODO: implement exclusive intersection
    $(`<input type="radio" id="radio${group}" name="groupSelection">  <span class="groupLabel group${group}">Group ${group}: # 0</span>
            <span class="edgeSelectionText" style="display:none"></span>
            <span class="selectionForm">
                 &ndash;
                Elements in the 
                <select class="selectionSetOperation" >
                    <option>intersection</option>
                    <option>exclusive intersection</option>
                    <option>union</option>
                    <option>k-set intersections</option>
                </select> 
                <span class="conjunction">of</span> 
                <span  class="selectionSets">${initBaseSetSelection(group)}</span>
                <select class="degreeSelection" style="display:none">${initDegreeSelection(group)}
                </select>
                at timestep 
                <select class="selectionTimestep">${initTimestepSelection()}</select>    
            <span>`).appendTo(selectionDiv);
    $(`<button class="addButton">+</button>`)
      .click(() => addGroupSelection(group))
      .appendTo(selectionDiv);
    $(`<button class="clearButton">x</button>`)
      .click(() => clearGroupSelection(group))
      .appendTo(selectionDiv);

    $(`#selection${group} .selectionSetOperation`).on("change", function (d) {
      var changedValue = $(`#selection${group} .selectionSetOperation`).val();
      if (changedValue == "k-set intersections") {
        $(`#selection${group} .selectionSets`).attr("style", "display:none");
        $(`#selection${group} .degreeSelection`).attr("style", "display:inline");
        $(`#selection${group} .conjunction`).text(", where k = ");
      } else {
        $(`#selection${group} .selectionSets`).attr("style", "display:inline");
        $(`#selection${group} .degreeSelection`).attr("style", "display:none");
        $(`#selection${group} .conjunction`).text(" of ");
      }
    });
    $(`#radioA`).prop("checked", true);
    selectionDiv.find(`input, select`).change(() => updateQuery(group));
  }

  // function initBaseSetSelection(group) {
  //   let s = "";
  //   visObject.getBaseSetNames().forEach((setName, i) => {
  //     s += `<span class="setCheckbox" ><input type="checkbox" value="${setName}" id="checkbox${group}${i}"><label for="checkbox${group}${i}">${setName}</label></input></span>`;
  //   });
  //   return s;
  // }
  function initBaseSetSelection(group) {
    let s = "";
    visObject.getBaseSetNames().forEach(([id, name], i) => {
      s += `<span class="setCheckbox">
                <input type="checkbox" value="${name}" id="checkbox${group}${id}">
                <label for="checkbox${group}${id}">${name}</label>
              </input>
              </span>`;
    });
    return s;
  }

  function initDegreeSelection(group) {
    let s = "";
    visObject.getBaseSetNames().forEach((setName, i) => {
      s += `<option value="${i + 1}">${i + 1}</option>`;
    });
    return s;
  }

  function initTimestepSelection() {
    let s = "";
    visObject.getTimesteps().forEach((timestep) => {
      s += `<option value="${timestep}">${timestep}</option>`;
    });
    return s;
  }

  function addGroupSelection(group) {
    $(`#selection${group} .selectionForm`).show();
    $(`#selection${group} .addButton`).hide();
    $(`#selection${group} .clearButton`).show();
    $(`#selection${group} .groupLabel`).addClass("active");
    // $(`#radio${group}`).attr("disabled", false);
    $(`#selectionAB .groupLabel`).addClass(`active${group}`);
    $(`#radio${group}`).prop("checked", true);
    updateQuery(group);
  }

  function clearGroupSelection(group) {
    $(`#selection${group} .edgeSelectionText`).hide();
    $(`#selection${group} .selectionForm`).hide();
    $(`#selection${group} .addButton`).show();
    $(`#selection${group} .clearButton`).hide();
    $(`#selection${group} .groupLabel`).removeClass("active");
    // $(`#radio${group}`).attr("disabled", true);
    $(`#selectionAB .groupLabel`).removeClass(`active${group}`);
    resetSelection(group);
    updateQuery(group);
  }

  function updateQuery(group) {
    const operator = $(`#selection${group} .selectionSetOperation`).val();
    const timestep = $(`#selection${group} .selectionTimestep`).val();
    const degree = parseInt($(`#selection${group} .degreeSelection`).val());
    const sets = [];
    $(`#selection${group} .selectionSets input:checked`).each((i, checkbox) => {
      sets.push($(checkbox).val());
    });
    visObject.updateQuery(group, operator, sets, timestep, degree);
  }

  function resetSelection(group) {
    $(`#selection${group} input:checked`).prop("checked", false);
    $(`#selection${group} select`).prop("selectedIndex", 0);
  }

  return {
    init: function () {
      $(`#selectionAB .groupLabel`).removeClass("activeA");
      $(`#selectionAB .groupLabel`).removeClass("activeA");
      initGroupSelection("A");
      initGroupSelection("B");
    },

    select: function (operator, sets, timestep, degree) {
      var group = "A";
      if ($("#radioA").is(":checked")) group = "A";
      else if ($("#radioB").is(":checked")) {
        group = "B";
      }

      $(`#selection${group} .edgeSelectionText`).attr("style", "display:none");
      $(`#selection${group} .selectionForm`).attr("style", "display:inline");

      clearGroupSelection(group);
      addGroupSelection(group);
      $(`#selection${group} .selectionSetOperation`).val(operator);
      $(`#selection${group} .selectionTimestep`).val(timestep);
      $(`#selection${group} .selectionSets input`).each((i, checkbox) => {
        checkbox.checked = sets.indexOf($(checkbox).val()) >= 0;
      });
      $(`#selection${group} .degreeSelection`).val(degree);
      if (operator == "k-set intersections") {
        $(`#selection${group} .selectionSets`).attr("style", "display:none");
        $(`#selection${group} .degreeSelection`).attr("style", "display:inline");
        $(`#selection${group} .conjunction`).text(", where k = ");
      } else {
        $(`#selection${group} .selectionSets`).attr("style", "display:inline");
        $(`#selection${group} .degreeSelection`).attr("style", "display:none");
        $(`#selection${group} .conjunction`).text(" of ");
      }
      updateQuery(group);
    },

    selectEdge: function (stmt, objects) {
      var group = "A";
      if ($("#radioA").is(":checked")) group = "A";
      else if ($("#radioB").is(":checked")) {
        group = "B";
      }
      clearGroupSelection(group);
      addGroupSelection(group);
      var container = $(`#selection${group} .edgeSelectionText`).empty();
      container.attr("style", "display:inline");
      d3.select(`#selection${group} .selectionForm`).attr("style", "display:none");
      // container.text(stmt);
      $("<span>&ndash; " + stmt + "</span>").appendTo(container);

      visObject.updateEdgeQuery(group, objects);
    },

    drawGroupSelectionStats: function (countAB, countA, countB) {
      if ("A" in window.selectedGroups && "B" in window.selectedGroups) {
        $(`#selectionAB .groupAB`).text("Group A+B: # " + countAB);
        $("#countAB").text(": " + countAB);
      }
      if ("A" in window.selectedGroups) {
        $(`#selectionA .groupA`).text("Group A: # " + countA);
        $("#countA").text(": " + countA);
      }
      if ("B" in window.selectedGroups) {
        $(`#selectionB .groupB`).text("Group B: # " + countB);
        $("#countB").text(": " + countB);
      }
    },
  };
})();
