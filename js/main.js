const glyphMap = {
  9: "🌱",
  12: "🔗",
  20: `🌊`,
};
function glyphify(step) {
  step = step.trim();
  return glyphMap[step] || step;
}
window.onload = function () {
  datasetSelection.init();
  selectionPanel.init();
  LineUpSelection.init();
};

const datasetSelection = (function () {
  return {
    currentLoadedDatasetIndex: 0,
    currentId: "",

    init: function () {
      this.currentLoadedDatasetIndex = 0;
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
        console.log("selected Value", selectedValue, [this.currentId]);

        this.refresh(this.currentId, selectedValue);
      });

      this.refresh([this.currentId], 4);
    },

    toggleDataSetInformation: function () {
      $("#id01").toggle();
    },

    refresh: function (id, ver) {
      this.currentId = id;
      visObject = DynaSet().loadHarcodedDatasetFromJavascriptObject(id, ver);
      selectionPanel.init();
      document.querySelector("#countA").textContent = ": 0";
      document.querySelector("#countB").textContent = ": 0";
      document.querySelector("#countAB").textContent = ": 0";
    },
  };
})();

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
                <label for="checkbox${group}${id}">${glyphify(name)}</label>
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

const LineUpSelection = (function () {
  return {
    init: function () {
      const rootSymbol = "┇";

      const arr = [];
      const globalMinMax = {};

      // — your permutation helper —
      function getPermutations(array) {
        if (array.length === 0) return [[]];
        const result = [];
        array.forEach((item, index) => {
          const rest = [...array.slice(0, index), ...array.slice(index + 1)];
          const permutations = getPermutations(rest);
          permutations.forEach((perm) => result.push([item, ...perm]));
        });
        return result;
      }

      // — the original createHierarchyFromPermutations, updated to glyphify every name —
      function createHierarchyFromPermutations(array) {
        const permutations = getPermutations(array);

        const root = {
          name: glyphify(rootSymbol),
          color: "black",
          children: [],
        };

        function addToHierarchy(node, path) {
          if (path.length === 0) return;

          // glyphify this step
          const [current, ...rest] = path;
          const label = glyphify(current);

          let childNode = node.children.find((child) => child.name === label);

          if (!childNode) {
            childNode = {
              name: label,
              children: [],
            };
            node.children.push(childNode);

            // preserve your original duplicate child
            const childNode2 = {
              name: label,
            };
            node.children.push(childNode2);
          }

          addToHierarchy(childNode, rest);
        }

        permutations.forEach((perm) => addToHierarchy(root, perm));

        return root;
      }

      // — 1) Find the longest raw flow & compute global min/max —
      let infras = [];
      for (const key in window.datasets) {
        const ds = window.datasets[key];
        const parts = ds.flow.split(" → ");
        if (parts.length > infras.length) infras = parts;

        for (const obj in ds.results) {
          const v = ds.results[obj];
          if (!globalMinMax[obj]) {
            globalMinMax[obj] = { min: v, max: v };
          } else {
            globalMinMax[obj].min = Math.min(globalMinMax[obj].min, v);
            globalMinMax[obj].max = Math.max(globalMinMax[obj].max, v);
          }
        }
      }

      // — 2) Glyph‐ify the longest flow before permuting —
      const glyphifiedInfras = infras.map(glyphify);
      const hierarchy = createHierarchyFromPermutations(glyphifiedInfras);

      // — 3) Build data array, glyphifying displayed flow —
      if (window.datasets && typeof window.datasets === "object") {
        for (const dsKey of Object.keys(window.datasets)) {
          const ds = window.datasets[dsKey];
          const updatedFlow = ds.flow.split(" → ").map(glyphify).join(" → ");

          arr.push({
            name: `Policy ${dsKey.split("_")[1]}`,
            Objective_1: ds.results.O_REL,
            Objective_2: ds.results.O_RF,
            Objective_3: ds.results.O_NPC,
            Objective_4: ds.results.O_PFC,
            Objective_5: ds.results.O_WCC,
            Objective_6: ds.results.O_UC,
            hierarchical: `${rootSymbol} → ${updatedFlow}`,
          });
        }
      } else {
        console.error("window.datasets is not a valid object.");
        return;
      }

      // — 4) Initialize LineUpJS with all six objectives + hierarchical glyph tree —
      const container = document.getElementById("lineupVisualization");
      if (!container) {
        console.error("LineUpJS container not found.");
        return;
      }

      const builder = LineUpJS.builder(arr)
        .column(LineUpJS.buildStringColumn("name").label("Policy").width(75))
        .column(LineUpJS.buildNumberColumn("Objective_1", [globalMinMax.O_REL.min, globalMinMax.O_REL.max]).label("Reliability").color("blue"))
        .column(
          LineUpJS.buildNumberColumn("Objective_2", [globalMinMax.O_RF.min, globalMinMax.O_RF.max]).label("Restriction Frequency").color("green").width(180)
        )
        .column(LineUpJS.buildNumberColumn("Objective_3", [globalMinMax.O_NPC.min, globalMinMax.O_NPC.max]).label("Net Present Cost").color("red").width(170))
        .column(
          LineUpJS.buildNumberColumn("Objective_4", [globalMinMax.O_PFC.min, globalMinMax.O_PFC.max]).label("Peak Financial Cost").color("orange").width(170)
        )
        .column(
          LineUpJS.buildNumberColumn("Objective_5", [globalMinMax.O_WCC.min, globalMinMax.O_WCC.max]).label("Worst Case Costs").color("purple").width(155)
        )
        .column(LineUpJS.buildNumberColumn("Objective_6", [globalMinMax.O_UC.min, globalMinMax.O_UC.max]).label("Unit Cost").color("magenta"))
        .column(LineUpJS.buildHierarchicalColumn("hierarchical", hierarchy).label("Hierarchical"))
        .rowHeight(50, 2)
        .groupRowHeight(100, 5);

      const ranking = LineUpJS.buildRanking().sortBy("name", "asc");
      builder.defaultRanking(ranking);

      const lineup = builder.build(container);

      // — 5) Your original selection logic, unchanged —
      lineup.on("selectionChanged", (selectedIndices) => {
        console.log(lineup);

        let selectedIds = [];
        if (selectedIndices.length > 0) {
          selectedIndices.forEach((selected) => {
            selectedIds.push("Path_" + arr[selected].name.split(" ")[1]);
          });
          const selectedRow = arr[selectedIndices[0]];
          const selectedValue = $("#datasetDropDown").val();
          datasetSelection.currentId = selectedRow.name;
          datasetSelection.refresh(selectedIds, selectedValue);
        } else {
          console.log("No dataset selected.");
        }
      });

      let lastIndex = null;
      setInterval(() => {
        const current = lineup.renderer.selectionIndicator.data?.[0]?.dataIndex;
        if (current !== undefined && current !== lastIndex) {
          console.log(current);
          lastIndex = current;
          const selectedValue = $("#datasetDropDown").val();
          datasetSelection.currentId = "Path_" + arr[lastIndex].name.split(" ")[1];
          datasetSelection.refresh(["Path_" + arr[lastIndex].name.split(" ")[1]], selectedValue);
        }
      }, 200);
    },
  };
})();
