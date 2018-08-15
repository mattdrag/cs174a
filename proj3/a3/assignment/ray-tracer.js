// CS 174a Project 3 Ray Tracer Skeleton

var mult_3_coeffs = function( a, b ) { return [ a[0]*b[0], a[1]*b[1], a[2]*b[2] ]; };       // Convenient way to combine two color-reducing vectors

Declare_Any_Class( "Ball",              // The following data members of a ball are filled in for you in Ray_Tracer::parse_line():
  { 'construct'( position, size, color, k_a, k_d, k_s, n, k_r, k_refract, refract_index )
      { this.define_data_members( { position, size, color, k_a, k_d, k_s, n, k_r, k_refract, refract_index, inverse } );
 
  // TODO:  Finish filling in data members, using data already present in the others.
  // Basically if you run into something that is calculated over and over again, just add it to here instead.
  // NOTE: consider adding the inverse matrix transformation to be cached here.
  //Most expensive function: 4x4 matrix inverse().
  //Need it for colliding with a ray.
  //– When to compute this?
  //• Once per sphere
        this.model_transform = identity();
        //this.model_transform = mult( this.model_transform, translation( position.x, position.y, position.z ) );
        this.model_transform = mult( this.model_transform, translation( position ) );
        this.model_transform = mult( this.model_transform, scale( size ) );
        this.inverse = inverse( this.model_transform );
      },
    'intersect'( ray, existing_intersection, minimum_dist )
      {
  // TODO:  Given a ray, check if this Ball is in its path.  Recieves as an argument a record of the nearest intersection found so far (a Ball pointer, a t distance
  //        value along the ray, and a normal), updates it if needed, and returns it.  Only counts intersections that are at least a given distance ahead along the ray.
  //        Tip:  Once intersect() is done, call it in trace() as you loop through all the spheres until you've found the ray's nearest available intersection.  Simply
  //        return a dummy color if the intersection tests positiv.  This will show the spheres' outlines, giving early proof that you did intersect() correctly.

      // What is a ray? here is some code from display:
      //  var ray = { origin: mult_vec( camera_inv, vec4(0, 0, 0, 1) ), dir: mult_vec( camera_inv, this.get_dir( x, y ) ) };   // Apply camera

      // What is an "existing_intersection"? here is some code from trace
      // var closest_intersection = { distance: Number.POSITIVE_INFINITY, ball: null, normal: null }    // An empty intersection object


        //We want to use the quadratic equation: |c|^2 * t^2 + 2(S dot c)*t + |S|^2 - 1 = 0
        var tempPos = this.position.concat(1); // transform vector to vec4
        var tempDir = ray.dir.slice();

        var relPos = subtract(tempPos, ray.origin); // take position relative to ray

        var S = mult_vec( this.inverse, relPos );  
        var C = mult_vec( this.inverse, tempDir );

        var a = dot(C, C); //|c|^2
        var b = dot(S, C); //(S dot c)
        var c = dot(S, S) - 1; //|S|^2 - 1

        var soln = null;
        var D = b*b - a*c; //calc D

        var invertNormal = false;

        if (D == 0) {
            soln = b / a;
        } else if (D > 0) {
            var rt = Math.sqrt(D);
            var soln1 = (b - rt) / a;
            var soln2 = (b + rt) / a;

            if (Math.min(soln1, soln2) >= minimum_dist){
              soln = Math.min(soln1, soln2);
            }
            else if (Math.max(soln1, soln2) >= minimum_dist) {
              soln = Math.max(soln1, soln2);
              invertNormal = true;
            }
        }

        if (soln != null && soln < existing_intersection.distance){
          existing_intersection.distance = soln;
          existing_intersection.ball = this;

          // intersection point and normal
          var rayScaled = scale_vec(existing_intersection.distance, tempDir);
          var intersectionPt = add(ray.origin, rayScaled);

          var normal = subtract(intersectionPt, this.position.concat(1));
          // for points inside sphere
          if (invertNormal) {
              normal = scale_vec(-1, normal);
              existing_intersection.inverted = true;
          }

          var trans = transpose(this.inverse);
          var normal_1 = mult(trans, this.inverse);
          normal = mult_vec(normal_1, normal);
          normal = normal.slice(0,3);
          normal = normal.concat(0);
          normal = normalize(normal);

          existing_intersection.normal = normal;
        } 

        return existing_intersection;
      }
  } );

Declare_Any_Class( "Ray_Tracer",
  { 'construct'( context )
      { this.define_data_members( { width: 32, height: 32, near: 1, left: -1, right: 1, bottom: -1, top: 1, ambient: [.1, .1, .1],
                                    balls: [], lights: [], curr_background_function: "color", background_color: [0, 0, 0, 1 ],
                                    scanline: 0, visible: true, scratchpad: document.createElement('canvas'), gl: context.gl,
                                    shader: context.shaders_in_use["Phong_Model"] } );
        var shapes = { "square": new Square(),                  // For texturing with and showing the ray traced result
                       "sphere": new Subdivision_Sphere( 4 ) };   // For drawing with ray tracing turned off
        this.submit_shapes( context, shapes );

        this.texture = new Texture ( context.gl, "", false, false );           // Initial image source: Blank gif file
        this.texture.image.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        context.textures_in_use[ "procedural" ]  =  this.texture;

        this.scratchpad.width = this.width;  this.scratchpad.height = this.height;
        this.imageData          = new ImageData( this.width, this.height );     // Will hold ray traced pixels waiting to be stored in the texture
        this.scratchpad_context = this.scratchpad.getContext('2d');             // A hidden canvas for assembling the texture

        this.background_functions =                 // These convert a ray into a color even when no balls were struck by the ray.
          { waves: function( ray )
            { return Color( .5*Math.pow( Math.sin( 2*ray.dir[0] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[0] + Math.sin( 10*ray.dir[1] ) + Math.sin( 10*ray.dir[2] ) ) ),
                            .5*Math.pow( Math.sin( 2*ray.dir[1] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[1] + Math.sin( 10*ray.dir[0] ) + Math.sin( 10*ray.dir[2] ) ) ),
                            .5*Math.pow( Math.sin( 2*ray.dir[2] ), 4 ) + Math.abs( .5*Math.cos( 8*ray.dir[2] + Math.sin( 10*ray.dir[1] ) + Math.sin( 10*ray.dir[0] ) ) ), 1 );
            },
            lasers: function( ray ) 
            { var u = Math.acos( ray.dir[0] ), v = Math.atan2( ray.dir[1], ray.dir[2] );
              return Color( 1 + .5 * Math.cos( 20 * ~~u  ), 1 + .5 * Math.cos( 20 * ~~v ), 1 + .5 * Math.cos( 8 * ~~u ), 1 );
            },
            mixture:     ( function( ray ) { return mult_3_coeffs( this.background_functions["waves" ]( ray ), 
                                                                   this.background_functions["lasers"]( ray ) ).concat(1); } ).bind( this ),
            ray_direction: function( ray ) { return Color( Math.abs( ray.dir[ 0 ] ), Math.abs( ray.dir[ 1 ] ), Math.abs( ray.dir[ 2 ] ), 1 );  },
            color:       ( function( ray ) { return this.background_color;  } ).bind( this )
          };       
        this.make_menu();
        this.load_case( "show_homework_spec" );
      },
    'get_dir'( ix, iy )   
      {
    // Map an (x,y) pixel to a corresponding xyz vector that reaches the near plane.  If correct, everything under the "background effects" menu will now work. 
         var x = this.left + (this.right - this.left)*( ix / this.width); // with an offset of left, the x component is the right - left with image x/width for scale
         var y = (this.top - this.bottom)*( iy / this.height) + this.bottom; // with an offset of bottom, the y component is the top - bottom with image y/height for scale
         return vec4(x, y, -this.near, 0);
      },
    'color_missed_ray'( ray ) { return mult_3_coeffs( this.ambient, this.background_functions[ this.curr_background_function ] ( ray ) ).concat(1); },
    'trace'( ray, color_remaining, is_primary, light_to_check = null )
      {
    // TODO:  Given a ray, return the color in that ray's path.  The ray either originates from the camera itself or from a secondary reflection or refraction off of a
    //        ball.  Call Ball.prototype.intersect on each ball to determine the nearest ball struck, if any, and perform vector math (the Phong reflection formula)
    //        using the resulting intersection record to figure out the influence of light on that spot.  Recurse for reflections and refractions until the final color
    //        is no longer significantly affected by more bounces.
    //
    //        Arguments besides the ray include color_remaining, the proportion of brightness this ray can contribute to the final pixel.  Only if that's still
    //        significant, proceed with the current recursion, computing the Phong model's brightness of each color.  When recursing, scale color_remaining down by k_r
    //        or k_refract, multiplied by the "complement" (1-alpha) of the Phong color this recursion.  Use argument is_primary to indicate whether this is the original
    //        ray or a recursion.  Use the argument light_to_check when a recursive call to trace() is for computing a shadow ray.
        
        // the original ray: check for an intersection

          if( length( color_remaining ) < .3 )    return Color( 0, 0, 0, 1 );  // Each recursion, check if there's any remaining potential for the pixel to be brightened.

          var closest_intersection = { distance: Number.POSITIVE_INFINITY, ball: null, normal: null }    // An empty intersection object

          //Call intersect() on each ball in this.balls, keeping track of closest_intersection
          for (var i = 0; i < this.balls.length; i++){
            // intersect'( ray, existing_intersection, minimum_dist )
            this.balls[i].intersect(ray, closest_intersection, 0.0001);
          }

          if( !closest_intersection.ball ){
            return this.color_missed_ray( ray ); 
          }
          else{
            // we do intersect: need to return the proper color as specefied by the phong shading model
            // Calculate intersection point and normal
            var tempDir = ray.dir.slice();
            var rayScaled = scale_vec(closest_intersection.distance, tempDir);
            var intersectionPt = add(ray.origin, rayScaled);

            //calc surface color initially using just ambient value k_a
            var surface_color = scale_vec(closest_intersection.ball.k_a, closest_intersection.ball.color); 

            var lights_total = vec3(0,0,0);
            //  apply light sources.
            for (var i = 0; i < this.lights.length; i++){
              //create a light_ray
              var light_ray = { origin: intersectionPt, dir: normalize(subtract(this.lights[i].position, intersectionPt)) };

              //send out light_ray. if theres something in the way of the light and the object there will be a shadow
              var light_intersection = { distance: Number.POSITIVE_INFINITY, ball: null, normal: null, inverted: false }    // An empty intersection object
              //Call intersect() on each ball in this.balls, keeping track of closest_intersection
              for (var j = 0; j < this.balls.length; j++){
                // intersect'( ray, existing_intersection, minimum_dist )
                this.balls[j].intersect(light_ray, light_intersection, 0.0001);
              }

              if (light_intersection.distance == Number.POSITIVE_INFINITY || light_intersection.inverted == true){ //you either didnt hit a ball or youre inside of the ball
                //this.lights[i].color * ( k_d * N dot L * the sphere's color + k_s * N dot H^n *  white )
                //diffusion part
                var N_dot_L = dot(closest_intersection.normal, light_ray.dir); // N_dot_L 
                if (N_dot_L < 0){ //only if positive
                  N_dot_L = 0;
                }
                var diffusion_scalar = closest_intersection.ball.k_d * N_dot_L;                         // k_d * N dot L 
                var diffusion = scale_vec(diffusion_scalar,closest_intersection.ball.color.slice(0,3));  // * the sphere's color

                //specular part
                var H =  normalize( subtract(light_ray.dir, tempDir) );            // H 
                var N_dot_H = dot(closest_intersection.normal, H);
                if (N_dot_H < 0){ //only if positive
                  N_dot_H = 0;
                }
                var N_dot_H_pow_n = Math.pow(N_dot_H, closest_intersection.ball.n); 

                //actually its R dot V. thanks spec.
                // var N = closest_intersection.normal.slice();
                // var N_scaled = scale_vec(N_dot_L*2, N);
                // var R =  normalize( subtract(N_scaled, ray.dir) );                  // R 
                // var V = scale_vec(-1, tempDir2);
                // var R_dot_V = dot(R, V);
                // if (R_dot_V < 0){ //only if positive
                //   R_dot_V = 0;
                // }
                // var R_dot_V_pow_n = Math.pow(R_dot_V, closest_intersection.ball.n);

                var specular_scalar = closest_intersection.ball.k_s * N_dot_H_pow_n;                        
                var specular = scale_vec(specular_scalar, Color(1,1,1,1).slice(0,3));  

                //final calculation
                var diffusion_and_specular = add(diffusion, specular);
                var light_contribution = mult_3_coeffs(this.lights[i].color.slice(0,3), diffusion_and_specular);
                lights_total = add(light_contribution, lights_total);
              }
            }

            surface_color = add(surface_color, lights_total); 
            for (var j = 0; j < surface_color.length; j++){
              if (surface_color[j] > 1){
                surface_color[j] = 1;
              }
            }
            
            //were going to need white_minus_sc
            var white_minus_sc = subtract(Color(1,1,1,1).slice(0,3), surface_color);

            //reflection and refraction
            var N = closest_intersection.normal.slice();
            var N_dot_l = dot(closest_intersection.normal, tempDir); // N_dot_l
            var N_scaled = scale_vec(N_dot_l*2, N);
            //reflection component
            var dirHelper_reflect = subtract(tempDir, N_scaled);
            var reflected_ray = { origin: intersectionPt, dir: normalize(dirHelper_reflect) };
            var reflect_color;
            if (is_primary){
              reflect_color = this.trace(reflected_ray, color_remaining, 0).slice(0,3); // starts recursion
            }
            else{
              reflect_color = this.trace(reflected_ray, (closest_intersection.ball.k_r*color_remaining*white_minus_sc), 0).slice(0,3); // starts recursion
            }
            var reflect = scale_vec(closest_intersection.ball.k_r, reflect_color);

            //refraction component
            //use snells law. just set r = refract_index 
            var r = closest_intersection.ball.refract_index;
            var c = dot(scale_vec(-1, closest_intersection.normal), tempDir);

            var l_scaled = scale_vec(r, tempDir);
            var bigNScalar = r*c - Math.sqrt(1-(Math.pow(r, 2)*(1-Math.pow(c, 2))));
            var N_scaled_2 = scale_vec(bigNScalar, closest_intersection.normal);
            var dirHelper_refract = add(l_scaled, N_scaled_2);
            var refracted_ray = { origin: intersectionPt, dir: normalize(dirHelper_refract) };
            var refract_color;
            if (is_primary){
              refract_color = this.trace(refracted_ray, color_remaining, 0).slice(0,3); // starts recursion
            }
            else{
              refract_color = this.trace(refracted_ray, (closest_intersection.ball.k_refract*color_remaining*white_minus_sc), 0).slice(0,3); // starts recursion
            }
            var refract = scale_vec(closest_intersection.ball.k_refract, refract_color);

            var reflect_plus_refract = add(reflect, refract);
            var reflect_and_refract = mult_3_coeffs(white_minus_sc, reflect_plus_refract);
            var pixel_color = add(surface_color, reflect_and_refract).concat(1);
            return pixel_color; 
          }
  
        return Color( 0, 0, 0, 1 );
      },
    'parse_line'( tokens )            // Load the lines from the textbox into variables
      { for( let i = 1; i < tokens.length; i++ ) tokens[i] = Number.parseFloat( tokens[i] );
        switch( tokens[0] )
          { case "NEAR":    this.near   = tokens[1];  break;
            case "LEFT":    this.left   = tokens[1];  break;
            case "RIGHT":   this.right  = tokens[1];  break;
            case "BOTTOM":  this.bottom = tokens[1];  break;
            case "TOP":     this.top    = tokens[1];  break;
            case "RES":     this.width             = tokens[1];   this.height            = tokens[2]; 
                            this.scratchpad.width  = this.width;  this.scratchpad.height = this.height; break;
            case "SPHERE":
              this.balls.push( new Ball( [tokens[1], tokens[2], tokens[3]], [tokens[4], tokens[5], tokens[6]], [tokens[7],tokens[8],tokens[9]], 
                                          tokens[10],tokens[11],tokens[12],  tokens[13],tokens[14],tokens[15],  tokens[16] ) ); break;
            case "LIGHT":   this.lights.push( new Light( [ tokens[1],tokens[2],tokens[3], 1 ], Color( tokens[4],tokens[5],tokens[6], 1 ),    10000000 ) ); break;
            case "BACK":    this.background_color = Color( tokens[1],tokens[2],tokens[3], 1 ); this.gl.clearColor.apply( this.gl, this.background_color ); break;
            case "AMBIENT": this.ambient = [tokens[1], tokens[2], tokens[3]];          
          }
      },
    'parse_file'()        // Move through the text lines
      { this.balls = [];   this.lights = [];
        this.scanline = 0; this.scanlines_per_frame = 1;                            // Begin at bottom scanline, forget the last image's speedup factor
        document.getElementById("progress").style = "display:inline-block;";        // Re-show progress bar
        this.camera_needs_reset = true;                                             // Reset camera
        var input_lines = document.getElementById( "input_scene" ).value.split("\n");
        for( let i of input_lines ) this.parse_line( i.split(/\s+/) );
      },
    'load_case'( i ) {   document.getElementById( "input_scene" ).value = test_cases[ i ];   },
    'make_menu'()
      { document.getElementById( "raytracer_menu" ).innerHTML = "<span style='white-space: nowrap'> \
          <button id='toggle_raytracing' class='dropbtn' style='background-color: #AF4C50'>Toggle Ray Tracing</button> \
          <button onclick='document.getElementById(\"myDropdown2\").classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #8A8A4C'> \
          Select Background Effect</button><div  id='myDropdown2' class='dropdown-content'>  </div>\
          <button onclick='document.getElementById(\"myDropdown\" ).classList.toggle(\"show\"); return false;' class='dropbtn' style='background-color: #4C50AF'> \
          Select Test Case</button        ><div  id='myDropdown' class='dropdown-content'>  </div> \
          <button id='submit_scene' class='dropbtn'>Submit Scene Textbox</button> \
          <div id='progress' style = 'display:none;' ></div></span>";
        for( let i in test_cases )
          { var a = document.createElement( "a" );
            a.addEventListener("click", function() { this.load_case( i ); this.parse_file(); }.bind( this    ), false);
            a.innerHTML = i;
            document.getElementById( "myDropdown"  ).appendChild( a );
          }
        for( let j in this.background_functions )
          { var a = document.createElement( "a" );
            a.addEventListener("click", function() { this.curr_background_function = j;      }.bind( this, j ), false);
            a.innerHTML = j;
            document.getElementById( "myDropdown2" ).appendChild( a );
          }
        
        document.getElementById( "input_scene" ).addEventListener( "keydown", function(event) { event.cancelBubble = true; }, false );
        
        window.addEventListener( "click", function(event) {  if( !event.target.matches('.dropbtn') ) {    
          document.getElementById( "myDropdown"  ).classList.remove("show");
          document.getElementById( "myDropdown2" ).classList.remove("show"); } }, false );

        document.getElementById( "toggle_raytracing" ).addEventListener("click", this.toggle_visible.bind( this ), false);
        document.getElementById( "submit_scene"      ).addEventListener("click", this.parse_file.bind(     this ), false);
      },
    'toggle_visible'() { this.visible = !this.visible; document.getElementById("progress").style = "display:inline-block;" },
    'set_color'( ix, iy, color )                           // Sends a color to one pixel index of our final result
      { var index = iy * this.width + ix;
        this.imageData.data[ 4 * index     ] = 255.9 * color[0];    
        this.imageData.data[ 4 * index + 1 ] = 255.9 * color[1];    
        this.imageData.data[ 4 * index + 2 ] = 255.9 * color[2];    
        this.imageData.data[ 4 * index + 3 ] = 255;  
      },
    'init_keys'( controls ) { controls.add( "SHIFT+r", this, this.toggle_visible ); },
    'display'( graphics_state )
      { graphics_state.lights = this.lights;
        graphics_state.projection_transform = perspective(90, 1, 1, 1000);
        if( this.camera_needs_reset ) { graphics_state.camera_transform = identity(); this.camera_needs_reset = false; }
        
        if( !this.visible )                          // Raster mode, to draw the same shapes out of triangles when you don't want to trace rays
        { for( let b of this.balls ) this.shapes.sphere.draw( graphics_state, b.model_transform, this.shader.material( b.color.concat(1), b.k_a, b.k_d, b.k_s, b.n ) );
          this.scanline = 0;    document.getElementById("progress").style = "display:none";     return; 
        } 
        if( !this.texture || !this.texture.loaded ) return;      // Don't display until we've got our first procedural image
        this.scratchpad_context.drawImage( this.texture.image, 0, 0 );
        this.imageData = this.scratchpad_context.getImageData( 0, 0, this.width, this.height );    // Send the newest pixels over to the texture
        var camera_inv = inverse( graphics_state.camera_transform );
        
        var desired_milliseconds_per_frame = 100;
        if( ! this.scanlines_per_frame ) this.scanlines_per_frame = 1;
        var milliseconds_per_scanline = Math.max( graphics_state.animation_delta_time / this.scanlines_per_frame, 1 );
        this.scanlines_per_frame = desired_milliseconds_per_frame / milliseconds_per_scanline + 1;
        for( var i = 0; i < this.scanlines_per_frame; i++ )     // Update as many scanlines on the picture at once as we can, based on previous frame's speed
        { var y = this.scanline++;
          if( y >= this.height ) { this.scanline = 0; document.getElementById("progress").style = "display:none" };
          document.getElementById("progress").innerHTML = "Rendering ( " + 100 * y / this.height + "% )..."; 
          for ( var x = 0; x < this.width; x++ )
          { var ray = { origin: mult_vec( camera_inv, vec4(0, 0, 0, 1) ), dir: mult_vec( camera_inv, this.get_dir( x, y ) ) };   // Apply camera
            this.set_color( x, y, this.trace( ray, [1,1,1], true ) );                                    // ******** Trace a single ray *********
          }
        }
        this.scratchpad_context.putImageData( this.imageData, 0, 0);          // Draw the image on the hidden canvas
        this.texture.image.src = this.scratchpad.toDataURL("image/png");      // Convert the canvas back into an image and send to a texture
        
        this.shapes.square.draw( new Graphics_State( identity(), identity(), 0 ), translation(0,0,-1), this.shader.material( Color( 0, 0, 0, 1 ), 1,  0, 0, 1, this.texture ) );
      }
  }, Scene_Component );