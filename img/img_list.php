<?
function dirfiles($dirname = '.', $relative = true) {
    if($dirname == ''){$dirname = '.';}
    if (!is_dir($dirname) || !is_readable($dirname)) {
        // check whether the directory is valid.
        return false;
    }

    $a = array();

    $handle = opendir($dirname);
    while (false !== ($file = readdir($handle))) {
        if ($file != '.' && $file != '..' && is_readable($dirname . DIRECTORY_SEPARATOR . $file)) {
            $ext = pathinfo($file, PATHINFO_EXTENSION);
            if (is_dir($dirname . DIRECTORY_SEPARATOR . $file)) {
                $a[($relative ? $file : $dirname . DIRECTORY_SEPARATOR . $file)] = dirfiles($dirname . DIRECTORY_SEPARATOR . $file, $relative);
            } else if ($ext == 'jpg' || $ext == 'png' || $ext == 'gif'){
                $a[] = ($relative ? $file : $dirname . DIRECTORY_SEPARATOR . $file);
            }
        }
    }
    closedir($handle);

    return $a;
}

header('Content-type: application/json');
header('Access-Control-Allow-Origin: *');
echo json_encode(dirfiles());
?>