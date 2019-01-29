let GLOBAL = {
        color : [150, 150, 150, 1],
        get color_str() {
            return `rgba(${this.color[0]},
            ${this.color[1]},
            ${this.color[2]},
            ${this.color[3]})`;
        },
        get color_0to1() {
            return [this.color[0]/255,
                    this.color[1]/255,
                    this.color[2]/255,
                    this.color[3]
            ];
        },
        stl_name: undefined //Le da sentido a otras funciones.
    };
    /*
    window.onload = function () {
        const init_color_str = GLOBAL.color_str; //Get color
        var picker_div = document.getElementById("picker"); // Todo esto es del Picker del color.
        picker_div.style.backgroundColor = init_color_str;
        picker_div.style.color = init_color_str;
        var picker = new Picker(
            {
                parent: picker_div,
                alpha: false,
                color: init_color_str
            }
        );
        picker_div.onclick = function() {
            picker.show();
        };
        picker.onDone = function(color) {
            GLOBAL.color = color.rgba;
            picker_div.style.background = color.rgbaString;
            picker_div.style.color = color.rgbaString;
            download_glb();
        };
    }
    */ // Todo esto es del Picker

    function uploaded(file) {
        // Checar si hay archivo.
        if (file === undefined) { // via upload button
            var uploadform = document.getElementById("fileuploadform");
            file = uploadform.files[0];

            // this helps to force trigger even if user upload the same file
            // https://stackoverflow.com/a/12102992/5260518
            this.value = null;
        }
        //C
        check_file(file, function(){check_file_success()}); // LA SEGUNDA PARTE ES PARA MANDARLO A LA FUNCIÓN DE  CHECK FILE SUCCESS

        function check_file_success() {

            put_status("Converting by your browser"); // Cambio el estátus

            var uploadform = document.getElementById("fileuploadform"); //Tomas el archivo
            var filename = file.name; // tomas la parte del nombre
            var fr = new FileReader(); // Es para hacer toda la manipulación desde la página web.
            fr.readAsDataURL(file); //CORS_

            fr.onload = function (){

                console.log(filename); // Pones solo el nombre en la consola
                 /* ESTO NO ES UTIL CONSIDERANDO QUE LOS DOCTORES NO SE VAN A TOMAR EL TIEMPO PARA CAMBIAR EL NOMBRE DEL ARCHIVO.
                if (filename === GLOBAL.stl_name) { // user upload the same file as last one
                    console.log("same stl file");
                    download_glb();
                    return;
                } else if (GLOBAL.stl_name !== undefined) { // not same file rm old file
                    console.log("new filename ", filename, "unlink", GLOBAL.stl_name);
                    Module['FS_unlink'](GLOBAL.stl_name);
                }
                */

                var stl_name = filename;

                // AQUI MANDA A LLAMAR LA FUNCION EN C.

                var data = atob(fr.result.split(",")[1]); // base64 to Uint8 for emscripten
                Module['FS_createDataFile'](".", stl_name, data, true, true);

                Module.ccall("make_bin", // c function name
                        undefined, // return
                        ["string"], // param
                        [stl_name]
                );

                // Using a file to output data from c++ to js
                // because if I use a pointer to array, if memory grow in wasm,
                // this array will be in a different place
                // then the pointer will be pointing to a wrong memory address
                let out_data = Module['FS_readFile']('data.txt', { encoding: 'utf8'}); // RECIBE UN TXT Y LO CONVIERTE EN UN ARCHIVO.
                out_data = out_data.split(" ");
                GLOBAL.number_indices = parseInt(out_data[0]);
                GLOBAL.number_vertices = parseInt(out_data[1]);
                GLOBAL.indices_blength = parseInt(out_data[2]);
                GLOBAL.vertices_blength = parseInt(out_data[3]);
                GLOBAL.total_blength = parseInt(out_data[4]);
                GLOBAL.minx = parseFloat(out_data[5]);
                GLOBAL.miny = parseFloat(out_data[6]);
                GLOBAL.minz = parseFloat(out_data[7]);
                GLOBAL.maxx = parseFloat(out_data[8]);
                GLOBAL.maxy = parseFloat(out_data[9]);
                GLOBAL.maxz = parseFloat(out_data[10]);
                GLOBAL.stl_name = stl_name;
                download_glb();
            }
        }
    }

    function gltf_dict(
        total_blength, indices_blength, vertices_boffset, vertices_blength,
        number_indices, number_vertices, minx, miny, minz, maxx, maxy, maxz,
        color_r, color_g, color_b
    ) {
        return {
            "scenes" : [
                {
                    "nodes" : [ 0 ]
                }
            ],
            "nodes" : [
                {
                    "mesh" : 0,
                    "rotation": [-0.70710678119, 0.0, 0.0, 0.70710678119]
                }
            ],
            "meshes" : [
                {
                    "primitives" : [ {
                        "attributes" : {
                            "POSITION" : 1
                        },
                        "indices" : 0,
                        "material" : 0
                    } ]
                }
            ],
            "buffers" : [
                {
                    "byteLength" : total_blength
                }
            ],
            "bufferViews" : [
                {
                    "buffer" : 0,
                    "byteOffset" : 0,
                    "byteLength" : indices_blength,
                    "target" : 34963
                },
                {
                    "buffer" : 0,
                    "byteOffset" : vertices_boffset,
                    "byteLength" : vertices_blength,
                    "target" : 34962
                }
            ],
            "accessors" : [
                {
                    "bufferView" : 0,
                    "byteOffset" : 0,
                    "componentType" : 5125,
                    "count" : number_indices,
                    "type" : "SCALAR",
                    "max" : [ number_vertices - 1 ],
                    "min" : [ 0 ]
                },
                {
                    "bufferView" : 1,
                    "byteOffset" : 0,
                    "componentType" : 5126,
                    "count" : number_vertices,
                    "type" : "VEC3",
                    "min" : [minx, miny, minz],
                    "max" : [maxx, maxy, maxz]
                }
            ],
            "asset" : {
                "version" : "2.0",
                 "generator": "STL2GLTF"
            },
            "materials": [
                {
                    "pbrMetallicRoughness": {
                        "baseColorFactor": [
                            color_r, // LOS COLORES DEL PICKER
                            color_g,
                            color_b,
                            1
                            ],
                        "metallicFactor": 1,
                        "roughnessFactor": 1
                    }
                }
            ],
        } // end of dict
    }

    function download_glb() {

        if (GLOBAL.stl_name === undefined) {
            put_status("Please upload a file");
            return;
        } else {
        }

        // TOMA TODOS LOS DATOS DE LA CONVERSIÓN:

        const stl_name = GLOBAL.stl_name;
        const color = GLOBAL.color_0to1;

        const total_blength = GLOBAL.total_blength;
        const indices_blength = GLOBAL.indices_blength;
        const vertices_boffset = GLOBAL.indices_blength;
        const vertices_blength = GLOBAL.vertices_blength;
        const number_indices = GLOBAL.number_indices;
        const number_vertices = GLOBAL.number_vertices;
        const minx = GLOBAL.minx;
        const miny = GLOBAL.miny;
        const minz = GLOBAL.minz;
        const maxx = GLOBAL.maxx;
        const maxy = GLOBAL.maxy;
        const maxz = GLOBAL.maxz;

        const gltf_json = JSON.stringify( // GENERA EL ARCHIVO DE INFO DE GLB
            gltf_dict(
                total_blength, indices_blength, vertices_boffset, vertices_blength,
                number_indices, number_vertices, minx, miny, minz, maxx, maxy, maxz,
                color[0], color[1], color[2]
            )
        );

        const out_bin_bytelength = total_blength;

        const header_bytelength = 20;
        const scene_len = gltf_json.length;
        const padded_scene_len = ((scene_len+ 3) & ~3);
        const body_offset = padded_scene_len + header_bytelength;
        const file_no_bin_len = body_offset + 8;
        const file_len = file_no_bin_len + out_bin_bytelength;

        let glb = new Uint8Array(file_no_bin_len);
        glb[0] = 0x67; // g
        glb[1] = 0x6c; // l
        glb[2] = 0x54; // t
        glb[3] = 0x46; // f

        glb[4]  = ( 2 ) & 0xFF;
        glb[5]  = ( 2>>8 ) & 0xFF;
        glb[6] = ( 2>>16 ) & 0xFF;
        glb[7] = ( 2>>24 ) & 0xFF;

        glb[8]  = ( file_len ) & 0xFF;
        glb[9]  = ( file_len>>8 ) & 0xFF;
        glb[10] = ( file_len>>16 ) & 0xFF;
        glb[11] = ( file_len>>24 ) & 0xFF;
        glb[12] = ( padded_scene_len ) & 0xFF;
        glb[13] = ( padded_scene_len>>8 ) & 0xFF;
        glb[14] = ( padded_scene_len>>16 ) & 0xFF;
        glb[15] = ( padded_scene_len>>24 ) & 0xFF;

        // JSON
        glb[16] = 0x4A; // J
        glb[17] = 0x53; // S
        glb[18] = 0x4F; // O
        glb[19] = 0x4E; // N

        for (let i=0;i<gltf_json.length;i++) {
            glb[i+header_bytelength] = gltf_json.charCodeAt(i);
        }
        for (let i=0;i<padded_scene_len - scene_len;i++) {
            glb[i+scene_len+header_bytelength] = 0x20;
        }

        glb[body_offset  ] = ( out_bin_bytelength ) & 0xFF;
        glb[body_offset+1] = ( out_bin_bytelength>>8 ) & 0xFF;
        glb[body_offset+2] = ( out_bin_bytelength>>16 ) & 0xFF;
        glb[body_offset+3] = ( out_bin_bytelength>>24 ) & 0xFF;
        glb[body_offset+4] = 0x42; // B
        glb[body_offset+5] = 0x49; // I
        glb[body_offset+6] = 0x4E; // N
        glb[body_offset+7] = 0x00; //

        let out_bin = Module['FS_readFile']('out.bin');

        let blob = new Blob([glb, out_bin], {type: 'application/sla'});
        let url = window.URL.createObjectURL(blob);
        var download_a = document.getElementById('download');
        download_a.href = url;
        const glb_name = stl_name.slice(0,stl_name.length-4) + ".glb";
        download_a.download = glb_name;

        var download_button = document.getElementById('download_button');
        download_button.disabled = false;
        download_button.innerHTML = "Click to Download " + glb_name;
        download_button.click();

        if (blob.size < 3145728) {
            put_status("Success, you are now share it on facebook!")
        } else {
            put_status("Your stl file is too large, the GLB file is bigger than 3 Mb, cannot share on facebook.")
        }
    }
    // ESTO ES PARA CHECAR SI ES UN STL O NO.
    function check_file(file, success_cb) {
        put_status("Checking file");
        const filename = file.name;
        const extension = filename.toLowerCase().slice(filename.lastIndexOf(".")+1, filename.length); // lo pasa todo a lowercase.
        if (extension!=="stl") {
            put_status("Please upload an stl file not "+ extension); // Cambia el mensaje.
            return;
        }
        success_cb(); // SE EJECUTA EL SUCCESS.
    }

    function dodrop(event) {
        var dt = event.dataTransfer;
        var file = dt.files[0];
        var filename = file.name;
        put_status("Converting " + filename + " to GLB using WebAssembly.");
        uploaded(file);
    }

    function put_status(text)
    {
        document.getElementById("status").textContent = text;
    }
