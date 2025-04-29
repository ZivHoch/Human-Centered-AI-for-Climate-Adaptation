window.onload = function () {
  datasetSelection.init();
  selectionPanel.init();
  LineUpSelection.init();
};

const datasetSelection = (function () {
  return {
    currentLoadedDatasetIndex: 0,
    currentId: "",




    // lineup.on("selectionChanged", (selectedIndices) => {
    //   let selectedIds = [];
    //   if (selectedIndices.length > 0) {
    //     selectedIndices.forEach((selected) => {
    //       selectedIds.push("Path_"+arr[selected].name.split(" ")[1]);
    //     });
    //     const selectedRow = arr[selectedIndices[0]];
    //     const selectedValue = $("#datasetDropDown").val();
    //     datasetSelection.currentId = selectedRow.name;
    //     datasetSelection.refresh(selectedIds, selectedValue);
    //   } else {
    //     console.log("No dataset selected.");
    //   }






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
      this.currentId = id
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

const LineUpSelection = (function () {
  return {
    init: function () {
      const rootSymbol = "┇";
      const arr = [];
      const globalMinMax = {};

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
      
      function createHierarchyFromPermutations(array) {
        const permutations = getPermutations(array);
      
        const root = {
          name: rootSymbol,
          color: 'black',
          children: [],
        };
      
        function addToHierarchy(node, path) {
          if (path.length === 0) return;
      
          const [current, ...rest] = path;
      
          let childNode = node.children.find((child) => child.name === current);
      
          if (!childNode) {

            childNode = {
              name: current,
              // color: generateColor(current), // Optional color logic
              children: [],
            };
            node.children.push(childNode);
            childNode2 = {
              name: current,
              // color: generateColor(current), // Optional color logic
            };
            node.children.push(childNode2);
          }
      
          addToHierarchy(childNode, rest);
        }
      
        permutations.forEach((perm) => addToHierarchy(root, perm));
      
        return root;
      }
      
      // Optional: Generate a color for each node
      function generateColor(name) {
        const colors = ['blue', 'red', 'green', 'yellow', 'purple'];
        return colors[parseInt(name, 10) % colors.length];
      }
      // function generateColorForHierarchy(name, layer) {
      //   const baseColors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'cyan', 'pink', 'brown', 'lime'];
      
      //   function hash(input) {
      //     let hashValue = 0;
      //     for (let i = 0; i < input.length; i++) {
      //       hashValue = (hashValue * 31 + input.charCodeAt(i)) % baseColors.length;
      //     }
      //     return hashValue;
      //   }
      
      //   const key = `${name}-${layer}`;
      //   const colorIndex = hash(key);
      //   return baseColors[colorIndex];
      // }
      
      let infras = []
      // Iterate over each path in the data
      for (const path in window.datasets) {
        const results = window.datasets[path].results;
        let curInfras = window.datasets[path].flow.split(" → ");
        if (curInfras.length > infras.length){
          infras = curInfras;
        }
        
        for (const key in results) {
          const value = results[key];
          // Update global min and max for each key
          if (!globalMinMax[key]) {
            globalMinMax[key] = { min: value, max: value };
          } else {
            globalMinMax[key].min = Math.min(globalMinMax[key].min, value);
            globalMinMax[key].max = Math.max(globalMinMax[key].max, value);
          }
        }
      }
      const hierarchy = createHierarchyFromPermutations(infras);
      
      // Use Object.keys to iterate over datasets
      if (window.datasets && typeof window.datasets === "object") {
        for (const dataset of Object.keys(window.datasets)) {
          arr.push({
            name: "Policy " +dataset.split("_")[1],
            Objective_1: window.datasets[dataset].results["O_REL"],
            Objective_2: window.datasets[dataset].results["O_RF"],
            Objective_3: window.datasets[dataset].results["O_NPC"],
            Objective_4: window.datasets[dataset].results["O_PFC"],
            Objective_5: window.datasets[dataset].results["O_WCC"],
            Objective_6: window.datasets[dataset].results["O_UC"],
            hierarchical: rootSymbol+" → "+window.datasets[dataset].flow, // Ensure no extra spaces around the flow
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
          .column(LineUpJS.buildStringColumn("name").label("Policy").width(75))
          .column(LineUpJS.buildNumberColumn("Objective_1", [globalMinMax["O_REL"].min, globalMinMax["O_REL"].max]).label("Reliability").color("blue"))
          .column(
            LineUpJS.buildNumberColumn("Objective_2", [globalMinMax["O_RF"].min, globalMinMax["O_RF"].max])
              .label("Restriction Frequency")
              .color("green")
              .width(181)
          )
          .column(
            LineUpJS.buildNumberColumn("Objective_3", [globalMinMax["O_NPC"].min, globalMinMax["O_NPC"].max]).label("Net Present Cost").color("red").width(168)
          )
          .column(
            LineUpJS.buildNumberColumn("Objective_4", [globalMinMax["O_PFC"].min, globalMinMax["O_PFC"].max])
              .label("Peak Financial Cost")
              .color("orange")
              .width(173)
          )
          .column(
            LineUpJS.buildNumberColumn("Objective_5", [globalMinMax["O_WCC"].min, globalMinMax["O_WCC"].max])
              .label("Worst Case Costs")
              .color("purple")
              .width(155)
          )
          .column(LineUpJS.buildNumberColumn("Objective_6", [globalMinMax["O_UC"].min, globalMinMax["O_UC"].max]).label("Unit Cost").color("magenta"))
          .column(
            LineUpJS.buildHierarchicalColumn("hierarchical", hierarchy)
              .label("Hierarchical")
          ).rowHeight(50, 2)
          .groupRowHeight(100, 5);

        // Define ranking
        const ranking = LineUpJS.buildRanking().sortBy("name", "asc"); // Sort rows by 'name' in ascending order

        // Set default ranking
        builder.defaultRanking(ranking);

        // Build LineUp visualization
        const lineup = builder.build(lineupContainer);
        // Listen to selection events
        lineup.on("selectionChanged", (selectedIndices) => {
          let selectedIds = [];
          if (selectedIndices.length > 0) {
            selectedIndices.forEach((selected) => {
              selectedIds.push("Path_"+arr[selected].name.split(" ")[1]);
            });
            const selectedRow = arr[selectedIndices[0]];
            const selectedValue = $("#datasetDropDown").val();
            datasetSelection.currentId = selectedRow.name;
            datasetSelection.refresh(selectedIds, selectedValue);
          } else {
            console.log("No dataset selected.");
          }
        });
      } else {
        console.error("LineUpJS container not found.");
      }
    },
  };
})();
